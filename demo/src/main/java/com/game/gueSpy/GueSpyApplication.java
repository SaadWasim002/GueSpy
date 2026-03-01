package com.game.gueSpy;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class GueSpyApplication {

	public static void main(String[] args) {
		SpringApplication.run(GueSpyApplication.class, args);
	}
}