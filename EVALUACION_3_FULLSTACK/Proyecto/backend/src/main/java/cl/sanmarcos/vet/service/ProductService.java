package cl.sanmarcos.vet.service;

import cl.sanmarcos.vet.model.Product;
import cl.sanmarcos.vet.repository.ProductRepository;
import cl.sanmarcos.vet.exception.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Locale;

@Service
@Transactional(readOnly = true)
public class ProductService {
    private final ProductRepository repository;
    private final cl.sanmarcos.vet.repository.CategoryRepository categories;
    public ProductService(ProductRepository repository, cl.sanmarcos.vet.repository.CategoryRepository categories) { this.repository = repository; this.categories=categories; }
    public List<Product> findAll(String search) {
        return search == null || search.isBlank() ? repository.findAll()
            : repository.findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(search.trim(), search.trim());
    }
    public Product findById(String id) { return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado: " + id)); }
    @Transactional
    public Product create(Product product) {
        product.setId(null);
        normalize(product);
        if (repository.existsByCodeIgnoreCase(product.getCode())) throw new ConflictException("Ya existe un producto con ese código.");
        return repository.save(product);
    }
    @Transactional
    public Product update(String id, Product data) {
        Product existing = repository.lockById(id).orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado."));
        normalize(data);
        if (repository.existsByCodeIgnoreCaseAndIdNot(data.getCode(), id)) throw new ConflictException("Ya existe un producto con ese código.");
        existing.setCode(data.getCode()); existing.setName(data.getName()); existing.setDescription(data.getDescription());
        existing.setCategoryEntity(data.getCategoryEntity()); existing.setPrice(data.getPrice()); existing.setStock(data.getStock());
        existing.setCritical(data.getCritical()); existing.setImage(data.getImage()); existing.setIcon(data.getIcon());
        return repository.save(existing);
    }
    @Transactional
    public void delete(String id) { repository.delete(repository.lockById(id).orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado."))); }
    private void normalize(Product p) {
        p.setCode(p.getCode().trim().toUpperCase(Locale.ROOT)); p.setName(p.getName().trim());
        p.setCategoryEntity(categories.findById(p.getCategory()).orElseThrow(() -> new ResourceNotFoundException("Categoría no encontrada.")));
    }
}
