package cl.sanmarcos.vet.orders;
import cl.sanmarcos.vet.auth.AppUser;
import jakarta.persistence.*;
import java.time.Instant;
import java.math.BigDecimal;
import java.util.*;
@Entity @Table(name="shop_orders")
public class ShopOrder {
    @Id @Column(length=40) String id="ORD-"+UUID.randomUUID();
    @ManyToOne(optional=false) @JoinColumn(name="customer_id") AppUser customer;
    @Column(nullable=false,unique=true,length=80) String requestKey;
    @Column(nullable=false,length=64) String requestHash;
    @Column(nullable=false) Instant createdAt=Instant.now();
    @Column(nullable=false,length=20) String status="CONFIRMADA";
    @Column(nullable=false,precision=16,scale=2) BigDecimal total=BigDecimal.ZERO;
    @OneToMany(mappedBy="order",cascade=CascadeType.ALL,orphanRemoval=true) @OrderBy("id")
    List<OrderItem> items=new ArrayList<>();
}
