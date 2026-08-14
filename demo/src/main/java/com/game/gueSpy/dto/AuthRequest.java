package com.game.gueSpy.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthRequest {
    // username is only required for registration; the register flow validates it.
    @JsonProperty("username")
    private String username;

    @NotBlank
    @Email
    @JsonProperty("email")
    private String email;

    @NotBlank
    @JsonProperty("password")
    private String password;

}
