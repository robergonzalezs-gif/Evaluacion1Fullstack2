package cl.sanmarcos.vet.config;

import cl.sanmarcos.vet.model.Product;
import cl.sanmarcos.vet.repository.ProductRepository;
import tools.jackson.databind.ObjectMapper;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.*;
import org.springframework.core.io.ClassPathResource;

@Configuration
public class SeedData {
    @Bean @org.springframework.core.annotation.Order(-100)
    CommandLineRunner categories(cl.sanmarcos.vet.service.CategoryService service) { return args -> service.migrate(); }
    @Bean
    @ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
    CommandLineRunner seed(ProductRepository repository, ObjectMapper mapper, cl.sanmarcos.vet.service.ProductService service) {
        return args -> {
            if (repository.count() == 0) {
                try (var stream = new ClassPathResource("products.json").getInputStream()) {
                    for (Product p : mapper.readValue(stream, Product[].class)) service.create(p);
                }
            }
        };
    }
}
