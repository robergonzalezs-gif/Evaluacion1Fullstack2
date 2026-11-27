package cl.sanmarcos.vet.auth;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
public interface UserRepository extends JpaRepository<AppUser, String> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select u from AppUser u where u.id = :id")
    Optional<AppUser> lockById(String id);
    Optional<AppUser> findByEmail(String email);
    boolean existsByEmail(String email);
}
