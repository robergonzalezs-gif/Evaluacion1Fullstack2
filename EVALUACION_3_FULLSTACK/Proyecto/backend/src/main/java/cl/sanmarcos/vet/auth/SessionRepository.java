package cl.sanmarcos.vet.auth;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
public interface SessionRepository extends JpaRepository<AuthSession, String> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<AuthSession> findByRefreshHash(String hash);
    void deleteByUserId(String userId);
}
