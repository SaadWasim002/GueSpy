package com.game.gueSpy.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CategoryRequest {
    @JsonProperty("category_id")
    private Long categoryId;

    @JsonProperty("category_name")
    private String categoryName;

    @JsonProperty("admin_only")
    @Builder.Default
    private Boolean adminOnly = false;

    @JsonProperty("updated_name")
    private String updateName;

    @JsonProperty("is_enabled")
    private Boolean isEnabled;
}