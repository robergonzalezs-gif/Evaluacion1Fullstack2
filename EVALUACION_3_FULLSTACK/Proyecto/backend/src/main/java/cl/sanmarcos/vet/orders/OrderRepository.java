package cl.sanmarcos.vet.orders;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import jakarta.persistence.LockModeType;
public interface OrderRepository extends JpaRepository<ShopOrder,String> {
    Optional<ShopOrder> findByRequestKey(String key);
    List<ShopOrder> findAllByOrderByCreatedAtDesc();
    List<ShopOrder> findByCustomerIdOrderByCreatedAtDesc(String id);
    @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select o from ShopOrder o where o.id=:id")
    Optional<ShopOrder> lockById(String id);
}
