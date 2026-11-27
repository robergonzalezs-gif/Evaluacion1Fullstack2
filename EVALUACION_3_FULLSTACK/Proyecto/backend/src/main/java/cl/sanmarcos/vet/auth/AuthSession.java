package cl.sanmarcos.vet.auth;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "auth_session")
public class AuthSession {
    @Id @Column(length = 36) String id = UUID.randomUUID().toString();
    @ManyToOne(optional = false) @JoinColumn(name = "user_id") AppUser user;
    @Column(nullable = false, unique = true, length = 64) String refreshHash;
    @Column(nullable = false) Instant expiresAt;
    protected AuthSession() {}
}
