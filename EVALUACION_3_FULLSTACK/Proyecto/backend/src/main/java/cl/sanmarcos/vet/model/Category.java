package cl.sanmarcos.vet.model;
import jakarta.persistence.*;
@Entity @Table(name="categories")
public class Category {
    @Id @Column(length=50) private String name;
    protected Category() {}
    public Category(String name) { this.name=name; }
    public String getName() { return name; }
}
