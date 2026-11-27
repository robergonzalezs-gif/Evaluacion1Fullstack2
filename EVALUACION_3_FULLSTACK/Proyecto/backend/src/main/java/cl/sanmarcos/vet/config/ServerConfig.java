package cl.sanmarcos.vet.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.boot.tomcat.servlet.TomcatServletWebServerFactory;

@Configuration
public class ServerConfig {
    @Bean
    WebServerFactoryCustomizer<TomcatServletWebServerFactory> connector() {
        // NIO2 avoids Windows Selector's internal loopback socket, which is
        // blocked on this development host. Both connectors serve HTTP/1.1.
        return factory -> factory.setProtocol("org.apache.coyote.http11.Http11Nio2Protocol");
    }
}
