package com.game.gueSpy.security;

import java.util.Date;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.game.gueSpy.entity.User;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class JwtUtil {
    
    @Value("${app.jwtSecret}")
    private String jwtSecret;

    public String generateToken(User user){
        return Jwts.builder()
            .setSubject(user.getUsername())
            .claim("role", user.getRole())
            .claim("userId", user.getId())
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60))
            .signWith(Keys.hmacShaKeyFor(jwtSecret.getBytes()), SignatureAlgorithm.HS256)
            .compact();
    }

    public String extractUsername(String token){
        return Jwts.parserBuilder()
            .setSigningKey(jwtSecret.getBytes())
            .build()
            .parseClaimsJws(token)
            .getBody()
            .getSubject();
    }

    public Long extractUserId(String token){
        return Jwts.parserBuilder()
            .setSigningKey(jwtSecret.getBytes())
            .build()
            .parseClaimsJws(token)
            .getBody()
            .get("userId", Long.class);
    }

    public boolean isTokenValid(String token){
        try {
            extractUsername(token);
            log.info("{} is valid token", token);
            return true;
        } catch (Exception e) {
            log.error("{} is not a valid token", token);
            return false;
        }
    }
}
