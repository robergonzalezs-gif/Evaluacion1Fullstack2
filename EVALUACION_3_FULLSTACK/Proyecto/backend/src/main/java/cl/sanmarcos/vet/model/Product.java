package cl.sanmarcos.vet.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;

@Entity
@Table(name = "products")
public class Product {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    @NotBlank @Size(min = 3, max = 50) @Column(nullable = false, unique = true, length = 50)
    private String code;
    @NotBlank @Size(max = 100) @Column(nullable = false, length = 100)
    private String name;
    @Size(max = 500) @Column(length = 500)
    private String description;
    @NotBlank @Pattern(regexp = "Alimentos|Salud|Higiene|Accesorios|Juguetes")
    private String category;
    // Nullable during the non-destructive migration of existing EP2 products.
    @ManyToOne @JoinColumn(name="category_name")
    private Category categoryEntity;
    @com.fasterxml.jackson.annotation.JsonIgnore
    public Category getCategoryEntity() { return categoryEntity; }
    public void setCategoryEntity(Category value) { categoryEntity=value; category=value.getName(); }
    @NotNull @DecimalMin("0.0") @Digits(integer = 10, fraction = 2) @Column(precision = 12, scale = 2, nullable = false)
    private BigDecimal price;
    @NotNull @Min(0) @Column(nullable = false)
    private Integer stock;
    @NotNull @Min(0)
    private Integer critical;
    @Size(max = 2000) @Pattern(regexp = "^$|https?://[^\\s]+", message = "Debe ser una URL HTTP o HTTPS") @Column(length = 2000)
    private String image;
    @Size(max = 20)
    private String icon;
    public Product() {}
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code == null ? null : code.trim(); }
    public String getName() { return name; }
    public void setName(String name) { this.name = name == null ? null : name.trim(); }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public Integer getStock() { return stock; }
    public void setStock(Integer stock) { this.stock = stock; }
    public Integer getCritical() { return critical; }
    public void setCritical(Integer critical) { this.critical = critical; }
    public String getImage() { return image; }
    public void setImage(String image) { this.image = image; }
    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
}
