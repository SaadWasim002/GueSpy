package com.game.gueSpy.security;

import java.io.IOException;

import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import com.game.gueSpy.dto.GenericResponse;
import com.game.gueSpy.enums.ResponseEnum;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import tools.jackson.databind.ObjectMapper;

/**
 * Returns a consistent {@link GenericResponse} body (instead of an empty 401)
 * when an unauthenticated request hits a protected endpoint. This keeps the
 * security layer's error shape aligned with the GlobalExceptionHandler output.
 */
@Component
@RequiredArgsConstructor
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        response.setStatus(ResponseEnum.UNAUTHORIZED.getStatus().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        GenericResponse<Void> body = GenericResponse.<Void>builder()
                .status(ResponseEnum.UNAUTHORIZED.getStatus())
                .message(ResponseEnum.UNAUTHORIZED.getMessage())
                .build();

        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
