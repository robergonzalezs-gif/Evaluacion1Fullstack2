package cl.sanmarcos.vet.auth;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "app_user")
public class AppUser {
    public String getId() { return id; }
    public String getEmail() { return email; }
    @Id @Column(length = 36) String id = UUID.randomUUID().toString();
    @Column(nullable = false, unique = true, length = 100) String email;
    @Column(nullable = false, length = 100) String passwordHash;
    @Column(nullable = false, length = 50) String name;
    @Column(length = 100) String lastName;
    @Column(length = 9) String run;
    @Column(length = 10) String birthDate;
    @Column(length = 100) String region;
    @Column(length = 100) String commune;
    @Column(length = 300) String address;
    @ManyToOne(optional = false) @JoinColumn(name = "role_name") Role role;
}
