package com.game.gueSpy.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CategoryRequest {
    @NotBlank
    @JsonProperty("category_name")
    private String categoryName;

    @JsonProperty("updated_name")
    private String updateName;

    @JsonProperty("is_enabled")
    private Boolean isEnabled;
}