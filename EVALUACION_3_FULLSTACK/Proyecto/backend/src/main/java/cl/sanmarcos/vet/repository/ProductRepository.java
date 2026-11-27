package cl.sanmarcos.vet.repository;

import cl.sanmarcos.vet.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, String> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select p from Product p where p.id = :id")
    java.util.Optional<Product> lockById(String id);
    boolean existsByCodeIgnoreCaseAndIdNot(String code, String id);
    boolean existsByCodeIgnoreCase(String code);
    List<Product> findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(String name, String description);
}
