package cl.sanmarcos.vet.auth;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.*;
import org.springframework.security.oauth2.jwt.*;

@Configuration
public class JwtConfig {
    @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }
    @Bean SecretKey jwtKey(@Value("${app.jwt.secret:}") String configured) {
        byte[] bytes;
        if (configured.isBlank()) { bytes=new byte[32]; new SecureRandom().nextBytes(bytes); }
        else bytes=Base64.getDecoder().decode(configured);
        if (bytes.length<32) throw new IllegalArgumentException("JWT_SECRET requiere al menos 32 bytes en Base64.");
        return new SecretKeySpec(bytes,"HmacSHA256");
    }
    @Bean JwtEncoder jwtEncoder(SecretKey key) { return NimbusJwtEncoder.withSecretKey(key).build(); }
    @Bean JwtDecoder jwtDecoder(SecretKey key) {
        NimbusJwtDecoder decoder=NimbusJwtDecoder.withSecretKey(key).build();
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
            new JwtTimestampValidator(Duration.ZERO),new JwtIssuerValidator("vet-api"),
            jwt -> jwt.getExpiresAt()!=null && jwt.getSubject()!=null && jwt.hasClaim("sid")
                ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token"))));
        return decoder;
    }
}
