package cl.sanmarcos.vet.auth;

import jakarta.persistence.*;

@Entity
@Table(name = "app_role")
public class Role {
    @Id @Column(length = 20) String name;
    protected Role() {}
    public Role(String name) { this.name = name; }
}
