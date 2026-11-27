package cl.sanmarcos.vet.controller;
import cl.sanmarcos.vet.repository.CategoryRepository;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1/categories")
public class CategoryController {
    private final CategoryRepository categories;
    public CategoryController(CategoryRepository categories) { this.categories=categories; }
    @GetMapping public java.util.List<String> list() { return categories.findAll().stream().map(c -> c.getName()).sorted().toList(); }
}
