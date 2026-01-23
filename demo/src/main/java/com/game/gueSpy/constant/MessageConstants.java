package com.game.gueSpy.constant;

public class MessageConstants {
    //REGISTER
    public static final String userRegistrationSuccess = "User registered successfully";
    public static final String userRegistrationFailure = "Registration failed";
    public static final String userAlreadyExist = "User already exist with this email";

    //LOGIN
    public static final String loginSuccess = "Login Successful";
    public static final String loginFailure = "Incorrect Password";
    public static final String userNotExists = "No user exists with this email";

    //CATEGORY
    public static final String categoryCreationSuccess = "Category created successfully";
    public static final String categoryAlreadyExist = "Category already exist with this name";
    public static final String categoryDeleted = "Category deleted successfully";
    public static final String categoryUpdated = "Category updated successfully";
    public static final String categoryNotExists = "Category does not exists";
    public static final String noCategoryFound = "No category found";
    public static final String categoriesRetrieved = "Categories retrieved successfully";

    //Word
    public static final String wordAdded = "Word added successfully";
    public static final String wordDeleted = "Word deleted successfully";
    public static final String wordAlreadyExist = "Word already exist with this name";
    public static final String wordIdNotExists = "Word does not exists with the word id";
    public static final String noWordFound = "No Word found for this category id";
    public static final String wordRetrieved = "Words retrieved successfully";

    public static final String valueMissing = "Some of the field is missing";
    public static final String unauthorized = "Unauthorized access";
    public static final String internalServerError = "Internal Server Error";
    public static final String testing = "Testing";

    //CONFIG
    public static final String configCreated = "Configuration created successfully";
    public static final String configRefreshed = "Configuration cache refreshed successfully";
    public static final String configAlreadyExists = "Configuration with this key already exists";
    public static final String configUpdated = "Configuration updated successfully";
    public static final String configNotExists = "Configuration does not exist";
    public static final String configRetrieved = "Configuration retrieved successfully";
    public static final String noConfigFound = "No configuration found";
}
