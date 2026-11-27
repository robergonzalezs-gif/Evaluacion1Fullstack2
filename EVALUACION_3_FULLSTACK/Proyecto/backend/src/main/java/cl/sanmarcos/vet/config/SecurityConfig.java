package cl.sanmarcos.vet.config;
import cl.sanmarcos.vet.auth.AuthService;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.*;
import org.springframework.web.server.ResponseStatusException;

@Configuration
public class SecurityConfig {
    @Bean SecurityFilterChain filter(HttpSecurity http, AuthService auth) throws Exception {
        return http.cors(Customizer.withDefaults()).csrf(csrf -> csrf.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a -> a.requestMatchers(HttpMethod.OPTIONS,"/**").permitAll()
                .requestMatchers("/swagger-ui.html","/swagger-ui/**","/v3/api-docs/**").permitAll()
                .requestMatchers(HttpMethod.GET,"/","/index.html","/assets/**","/favicon.ico").permitAll()
                .requestMatchers(HttpMethod.POST,"/api/v1/auth/login","/api/v1/auth/register","/api/v1/auth/refresh","/api/v1/auth/logout").permitAll()
                .requestMatchers("/api/v1/auth/me","/api/session").authenticated()
                .requestMatchers(HttpMethod.POST,"/api/v1/encomienda").permitAll()
                .requestMatchers(HttpMethod.GET,"/api/v1/encomienda/{codigo}").permitAll()
                .requestMatchers(HttpMethod.GET,"/api/products","/api/products/**","/api/v1/products","/api/v1/products/**","/api/v1/categories").permitAll()
                .requestMatchers(HttpMethod.GET,"/api/v1/orders","/api/v1/orders/**").hasAnyRole("Administrador","Vendedor","Cliente")
                .requestMatchers(HttpMethod.POST,"/api/v1/orders").hasAnyRole("Administrador","Cliente")
                .requestMatchers("/api/**").hasRole("Administrador").anyRequest().denyAll())
            .oauth2ResourceServer(o -> o.jwt(j -> j.jwtAuthenticationConverter(jwt -> {
                try {
                    var user=AuthService.view(auth.authenticated(jwt));
                    return new JwtAuthenticationToken(jwt,List.of(new SimpleGrantedAuthority("ROLE_"+user.role())));
                } catch (ResponseStatusException e) { throw new OAuth2AuthenticationException("invalid_token"); }
            })).authenticationEntryPoint((req,res,ex) -> {
                res.setStatus(401); res.setContentType("application/json;charset=UTF-8");
                res.getWriter().write("{\"error\":\"Inicia sesión nuevamente.\"}");
            }))
            .exceptionHandling(e -> e.accessDeniedHandler((req,res,ex) -> {
                res.setStatus(403); res.setContentType("application/json;charset=UTF-8");
                res.getWriter().write("{\"error\":\"No tienes permisos para esta operación.\"}");
            })).build();
    }
    @Bean CorsConfigurationSource corsConfigurationSource(@Value("${app.cors.origins}") String origins) {
        CorsConfiguration c=new CorsConfiguration();
        c.setAllowedOrigins(Arrays.stream(origins.split(",")).map(String::trim).toList());
        c.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS"));
        c.setAllowedHeaders(List.of("Content-Type","Authorization"));
        c.setExposedHeaders(List.of("Location")); c.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source=new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**",c); return source;
    }
}
