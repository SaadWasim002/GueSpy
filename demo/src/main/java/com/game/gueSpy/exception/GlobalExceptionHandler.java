package com.game.gueSpy.exception;

import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.game.gueSpy.dto.GenericResponse;
import com.game.gueSpy.enums.ResponseEnum;
import com.game.gueSpy.utility.GenericUtility;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(GameException.class)
    public ResponseEntity<?> handleGameException(GameException ex) {

        ResponseEnum responseEnum = ex.getResponseEnum();

        return GenericUtility.buildResponse(responseEnum);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<GenericResponse<Void>> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(err -> err.getField() + " " + err.getDefaultMessage())
                .collect(Collectors.joining("; "));
        log.warn("Validation failed: {}", message);

        GenericResponse<Void> body = GenericResponse.<Void>builder()
                .status(HttpStatus.BAD_REQUEST)
                .message(message)
                .build();

        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<?> handleUnreadableBody(HttpMessageNotReadableException ex) {
        log.warn("Malformed request body: {}", ex.getMessage());

        return GenericUtility.buildResponse(ResponseEnum.MALFORMED_REQUEST);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<?> handleAccessDenied(AccessDeniedException ex) {
        log.warn("Access denied: {}", ex.getMessage());

        return GenericUtility.buildResponse(ResponseEnum.ACCESS_DENIED);
    }

    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<?> handleOptimisticLock(ObjectOptimisticLockingFailureException ex) {
        log.warn("Concurrent modification detected: {}", ex.getMessage());

        return GenericUtility.buildResponse(ResponseEnum.CONCURRENT_MODIFICATION);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGenericException(Exception ex){
        log.error("Unexpected error", ex);

        return GenericUtility.buildResponse(ResponseEnum.INTERNAL_SERVER_ERROR);
    }
}