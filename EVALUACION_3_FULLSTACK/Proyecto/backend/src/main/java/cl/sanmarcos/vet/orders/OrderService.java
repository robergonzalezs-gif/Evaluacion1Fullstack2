package cl.sanmarcos.vet.orders;
import cl.sanmarcos.vet.auth.UserRepository;
import cl.sanmarcos.vet.model.Product;
import cl.sanmarcos.vet.repository.ProductRepository;
import cl.sanmarcos.vet.exception.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service @Transactional
public class OrderService {
    public record ItemInput(@NotBlank String id,@Min(1) @Max(1000) int quantity) {}
    public record Create(@NotBlank @Pattern(regexp="[a-fA-F0-9-]{36}") String requestId,
        @NotEmpty @Size(max=100) List<@NotNull @Valid ItemInput> items) {}
    public record ItemView(String id,String name,int quantity,BigDecimal price) {}
    public record View(String id,Instant createdAt,String customer,String status,BigDecimal total,List<ItemView> items) {}
    private final OrderRepository orders;
    private final ProductRepository products;
    private final UserRepository users;
    public OrderService(OrderRepository orders,ProductRepository products,UserRepository users) {
        this.orders=orders; this.products=products; this.users=users;
    }
    private View view(ShopOrder o) {
        return new View(o.id,o.createdAt,o.customer.getEmail(),o.status,o.total,
            o.items.stream().map(i -> new ItemView(i.product.getId(),i.name,i.quantity,i.price)).toList());
    }
    @Transactional(readOnly=true) public List<View> list(String user,boolean staff) {
        return (staff?orders.findAllByOrderByCreatedAtDesc():orders.findByCustomerIdOrderByCreatedAtDesc(user)).stream().map(this::view).toList();
    }
    @Transactional(readOnly=true) public View get(String id,String user,boolean staff) {
        var o=orders.findById(id).orElseThrow(() -> new ResourceNotFoundException("Orden no encontrada."));
        if (!staff && !o.customer.getId().equals(user)) throw new ResourceNotFoundException("Orden no encontrada.");
        return view(o);
    }
    public View create(Create data,String userId) {
        // A user-row lock serializes retries; product locks prevent overselling across users.
        var user=users.lockById(userId).orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado."));
        TreeMap<String,Integer> quantities=new TreeMap<>();
        for (var item : data.items()) {
            if (quantities.putIfAbsent(item.id(),item.quantity())!=null) throw new ConflictException("No repitas productos en la solicitud.");
        }
        String fingerprint;
        try { fingerprint=HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(quantities.toString().getBytes(StandardCharsets.UTF_8))); }
        catch (java.security.NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
        String key=userId+":"+data.requestId();
        var previous=orders.findByRequestKey(key);
        if (previous.isPresent()) {
            if (!previous.get().requestHash.equals(fingerprint)) throw new ConflictException("La solicitud ya fue utilizada con otro carrito.");
            return view(previous.get());
        }
        ShopOrder order=new ShopOrder(); order.customer=user; order.requestKey=key; order.requestHash=fingerprint;
        for (var entry : quantities.entrySet()) {
            Product p=products.lockById(entry.getKey()).orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado."));
            if (p.getStock()<entry.getValue()) throw new ConflictException("Stock insuficiente para "+p.getName()+".");
            p.setStock(p.getStock()-entry.getValue());
            OrderItem item=new OrderItem(); item.order=order; item.product=p; item.name=p.getName(); item.price=p.getPrice(); item.quantity=entry.getValue();
            order.items.add(item); order.total=order.total.add(item.price.multiply(BigDecimal.valueOf(item.quantity)));
        }
        return view(orders.saveAndFlush(order));
    }
    public View status(String id,String status) {
        ShopOrder o=orders.lockById(id).orElseThrow(() -> new ResourceNotFoundException("Orden no encontrada."));
        if (o.status.equals(status)) return view(o);
        if (!o.status.equals("CONFIRMADA") || !Set.of("CANCELADA","ENTREGADA").contains(status))
            throw new ConflictException("Solo una orden confirmada puede cancelarse o entregarse.");
        if (status.equals("CANCELADA")) {
            for (var i : o.items.stream().sorted(Comparator.comparing(i -> i.product.getId())).toList()) {
                var p=products.lockById(i.product.getId()).orElseThrow();
                try { p.setStock(Math.addExact(p.getStock(),i.quantity)); }
                catch (ArithmeticException e) { throw new ConflictException("El stock excede el límite permitido."); }
            }
        }
        o.status=status; return view(o);
    }
    public void delete(String id) {
        var o=orders.lockById(id).orElseThrow(() -> new ResourceNotFoundException("Orden no encontrada."));
        if (!o.status.equals("CANCELADA")) throw new ConflictException("Solo se pueden eliminar órdenes canceladas.");
        orders.delete(o);
    }
}
