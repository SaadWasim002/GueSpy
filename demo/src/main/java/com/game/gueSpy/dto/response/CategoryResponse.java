package com.game.gueSpy.dto.response;

import java.util.List;

import com.game.gueSpy.entity.Category;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryResponse{
    private List<Category> categories;
    
}
