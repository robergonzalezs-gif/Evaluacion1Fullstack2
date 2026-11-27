package cl.sanmarcos.vet.orders;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
@RestController @RequestMapping("/api/v1/orders")
@SecurityRequirement(name="bearerAuth") @Tag(name="Órdenes",description="Compra académica con stock transaccional; no procesa pagos ni emite boletas fiscales")
public class OrderController {
    private final OrderService service;
    public OrderController(OrderService service) { this.service=service; }
    private boolean staff(JwtAuthenticationToken auth) { return auth.getAuthorities().stream().anyMatch(a -> !a.getAuthority().equals("ROLE_Cliente")); }
    public record Status(@NotNull @Pattern(regexp="CANCELADA|ENTREGADA") String status) {}
    @GetMapping public Object list(JwtAuthenticationToken auth) { return service.list(auth.getName(),staff(auth)); }
    @GetMapping("/{id}") public Object one(@PathVariable String id,JwtAuthenticationToken auth) { return service.get(id,auth.getName(),staff(auth)); }
    @PostMapping public ResponseEntity<?> create(@Valid @RequestBody OrderService.Create data,JwtAuthenticationToken auth) {
        var order=service.create(data,auth.getName());
        return ResponseEntity.created(java.net.URI.create("/api/v1/orders/"+order.id())).body(order);
    }
    @PutMapping("/{id}") public Object update(@PathVariable String id,@Valid @RequestBody Status data) { return service.status(id,data.status()); }
    @DeleteMapping("/{id}") public ResponseEntity<?> delete(@PathVariable String id) { service.delete(id); return ResponseEntity.noContent().build(); }
}
