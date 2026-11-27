package cl.sanmarcos.vet.orders;
import cl.sanmarcos.vet.model.Product;
import jakarta.persistence.*;
import java.math.BigDecimal;
@Entity @Table(name="order_items")
public class OrderItem {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
    @ManyToOne(optional=false) @JoinColumn(name="order_id") ShopOrder order;
    @ManyToOne(optional=false) @JoinColumn(name="product_id") Product product;
    @Column(nullable=false,length=100) String name;
    @Column(nullable=false) int quantity;
    @Column(nullable=false,precision=12,scale=2) BigDecimal price;
}
