package cl.sanmarcos.vet.service;
import cl.sanmarcos.vet.model.Category;
import cl.sanmarcos.vet.repository.*;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service
public class CategoryService {
    private final CategoryRepository categories;
    private final ProductRepository products;
    public CategoryService(CategoryRepository categories,ProductRepository products) { this.categories=categories; this.products=products; }
    @Transactional public void migrate() {
        for (String name : List.of("Alimentos","Salud","Higiene","Accesorios","Juguetes"))
            if (!categories.existsById(name)) categories.save(new Category(name));
        for (var p : products.findAll()) if (p.getCategoryEntity()==null)
            p.setCategoryEntity(categories.findById(p.getCategory()).orElseThrow());
    }
}
