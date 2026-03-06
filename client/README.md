# GueSpy Frontend Product Requirements Document (PRD)

## 1. Introduction

### 1.1. Purpose
This document outlines the product requirements for the GueSpy frontend application. The primary goal is to create a sleek, modern, minimalist, and dark-themed user interface that facilitates user authentication and the initial game setup flow, specifically category selection.

### 1.2. Scope
This PRD covers the following core functionalities:
- User Authentication: Registration, Login, and Logout.
- Initial Game Flow: Determining game state, starting a new game, and selecting a category.
- Global Error Handling.

Future phases will cover other game screens and an ADMIN specific interface.

### 1.3. Target Audience
This document is intended for frontend developers, UI/UX designers, and quality assurance engineers involved in the GueSpy project.

## 2. UI/UX Design Principles

### 2.1. Visual Style
- **Theme**: Dark mode, minimalist design.
- **Aesthetics**: Sleek, modern, and clean. Emphasis on clear typography, subtle animations, and intuitive layouts.
- **Color Palette**: Predominantly dark backgrounds with contrasting, muted accent colors for interactive elements and text. Avoid overly bright or distracting elements.
- **Typography**: Use a legible, modern sans-serif font.
- **Iconography**: Simple, clear icons to enhance usability without clutter.

### 2.2. Component Reusability
- All UI components (e.g., buttons, input fields, modals, loading indicators, error messages) must be designed and implemented for maximum reusability across the application. This ensures consistency, reduces development time, and simplifies maintenance.

## 3. Functional Requirements

### 3.1. Authentication Module

#### 3.1.1. User Registration
- **Description**: Allows new users to create an account.
- **UI**: A dedicated registration screen with input fields for:
    - Username
    - Email
    - Password (with a "Show/Hide Password" toggle)
    - Confirm Password
- **Actions**:
    - "Register" button: Submits the form.
    - "Already have an account? Login": Navigates to the login screen.
- **API Endpoint**: `POST http://localhost:8080/auth/register`
    - **Request**: `{ "username": "...", "email": "...", "password": "..." }`
    - **Success (201 CREATED)**: Display a success message (e.g., "Registration successful! Please log in."), store the received JWT token and extract the `userId` from the token. Automatically log the user in or redirect to the login screen.
    - **Error (409 CONFLICT)**: Display "User already exists with this email."
    - **Error (400 BAD_REQUEST)**: Display "Some fields are missing or invalid."
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.

#### 3.1.2. User Login
- **Description**: Allows existing users to log in.
- **UI**: A dedicated login screen with input fields for:
    - Email
    - Password (with a "Show/Hide Password" toggle)
- **Actions**:
    - "Login" button: Submits the form.
    - "Don't have an account? Register": Navigates to the registration screen.
- **API Endpoint**: `POST http://localhost:8080/auth/login`
    - **Request**: `{ "email": "...", "password": "..." }`
    - **Success (200 OK)**: Display "Login Successful", store the received JWT token and extract the `userId` from the token. Redirect to the Initial Game Screen.
    - **Error (401 UNAUTHORIZED)**: Display "Incorrect email or password."
    - **Error (404 NOT_FOUND)**: Display "No user exists with this email."
    - **Error (400 BAD_REQUEST)**: Display "Email and password are required."
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.

#### 3.1.3. User Logout
- **Description**: Allows a logged-in user to end their session.
- **UI**: A "Logout" button or link, typically accessible from a user profile menu or header.
- **Actions**:
    - On click: Clears the stored JWT token and `userId` from client-side storage and redirects to the Login/Registration screen.
- **API Endpoint**: `POST http://localhost:8080/auth/logout`
    - **Success (200 OK)**: Backend invalidates the token (if applicable). Frontend clears local token and redirects.
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.

### 3.2. Game Initialization & Category Selection Module

#### 3.2.1. Initial Game Screen
- **Description**: The first screen a user sees after logging in or after a game reset, offering options to continue or start fresh.
- **UI**: A central screen with two prominent, distinct buttons:
    - "Continue Game"
    - "New Game"
- **Logic**: This screen is displayed after the frontend determines the current game status via `GET /game-engine/get-screen`.

#### 3.2.2. New Game Flow
- **Description**: Resets the user's current game progress and starts a new game.
- **Trigger**: User clicks the "New Game" button.
- **API Endpoint**: `POST http://localhost:8080/game-engine/reset`
    - **Request Headers**:  `Authorization: Bearer <token>` 
    - **Success (200 OK)**: Upon successful reset, the frontend must immediately call `GET /game-engine/get-screen` to determine the next screen, which should be `CATEGORY_SELECTION`.
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.

#### 3.2.3. Current Screen Determination
- **Description**: Determines the user's current game state and navigates to the appropriate screen. This API call is crucial and should be made:
    1.  Immediately after successful login.
    2.  Immediately after a successful "New Game" reset.
- **API Endpoint**: `GET http://localhost:8080/game-engine/get-screen`
    - **Request Headers**:  `Authorization: Bearer <token>`
    - **Expected Response**: A DTO containing `gameStatus` (e.g., `NOT_STARTED`, `CATEGORY_SELECTION`, `GROUP_SELECTION`, etc.) and `ScreenData` relevant to the current status.
    - **Logic**:
        - The frontend will navigate to the appropriate screen based on the `gameStatus` value.
        - `NOT_STARTED` or `CATEGORY_SELECTION`: Navigate to Category Selection Screen.
        - `GROUP_SELECTION`: Navigate to Group Selection Screen.
        - `GAME_OPTION_SELECTION`: Navigate to Game Option Selection Screen.
        - `WORD_AND_SPY_REVEAL`: Navigate to Word and Spy Reveal Screen.
        - `DISCUSSION_TIME`: Navigate to Discussion Time Screen.
        - (Future: Handle other `gameStatus` values like `VOTING`, `GAME_OVER`, etc.)
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.

#### 3.2.4. Category Selection Screen
- **Description**: Allows the user to browse and select a game category.
- **UI**:
    - A clear title: "Select a Category".
    - A scrollable list or grid of available categories. Each category item should display its `categoryName`.
    - Each category item should be clickable.
    - A visual indicator for the currently selected category.
    - **Future Considerations**:
        - Support for random category selection (e.g., a "Surprise Me!" button).
        - Display an image on each category card.
        - Allow multi-selection of categories (if game logic supports it).
    - A "Continue" or "Next" button to confirm the selection (optional, or selection can trigger immediate progression).
- **API Endpoint (Get Categories)**: `GET http://localhost:8080/category/get`
    - **Request Headers**: `Authorization: Bearer <token>`
    - **Success (200 OK)**: Display the list of categories.
    - **Error (404 NOT_FOUND - NO_CATEGORY_FOUND)**: Display "No categories available. Please check back later."
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.
- **API Endpoint (Select Category)**: `POST http://localhost:8080/category/select`
    - **Request Headers**: `Authorization: Bearer <token>`
    - **Request Body**: `{ "id": <selectedCategoryId> }`
    - **Success (200 OK)**: Display "Category selected successfully." The frontend must then immediately call `GET /game-engine/get-screen` to determine the next screen (expected to be `GROUP_SELECTION`).
    - **Error (404 NOT_FOUND - CATEGORY_NOT_EXISTS)**: Display "Selected category does not exist or is no longer available."
    - **Error (400 BAD_REQUEST - INVALID_GAME_STATUS)**: Display "Invalid game state for category selection."
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.

#### 3.2.5. Group Selection Screen
- **Description**: Allows the user to manage and select a group of players for the game. This screen is displayed when the `gameStatus` from `GET /game-engine/get-screen` is `GROUP_SELECTION`.
- **UI**:
    - A clear title: "Select or Create a Group".
    - A section displaying a list or grid of existing groups for the user. Each group item should prominently display the `groupName`.
    - Each group item should be clickable to view/edit group details.
    - A prominent "Add New Group" button.
    - **Group Details/Edit View (Modal or New Screen)**:
        - Displays `groupName` and a list of `playerNames`.
        - Allows editing `groupName` and `playerNames`.
        - "Save Changes" button.
        - "Delete Group" button (with confirmation).
    - **Add New Group Form (Modal or New Screen)**:
        - Input field for "Group Name".
        - Initial input field for "Player 1 Name".
        - A button "Add another player" which dynamically adds a new input field for a player name.
        - Validation:
            - Group name is required.
            - Player names are required.
            - Number of players must be within the configured min/max limits (fetched from `/config/get`).
        - "Create Group" button.
- **API Endpoint (Get All Groups)**: `GET http://localhost:8080/group/get`
    - **Request Headers**: `Authorization: Bearer <token>`
    - **Success (200 OK)**: Display the list of groups. Frontend should also check `max_group_allowed` config to disable "Add New Group" button if limit is reached.
    - **Error (404 NOT_FOUND - NO_GROUP_FOUND)**: Display "No groups found. Start by creating one!"
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.
- **API Endpoint (Get Particular Group)**: `GET http://localhost:8080/group/get?groupId={id}`
    - **Request Headers**: `Authorization: Bearer <token>`
    - **Success (200 OK)**: Display details of the requested group.
    - **Error (404 NOT_FOUND - NO_GROUP_FOUND)**: Display "Group not found."
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.
- **API Endpoint (Create Group)**: `POST http://localhost:8080/group/create`
    - **Request Headers**: `Authorization: Bearer <token>` (Backend will extract `userId` from JWT)
    - **Request Body**:
        ```json
        {
            "group_name": "...",
            "players": [
                "Player1 Name",
                "Player2 Name"
            ]
        }
        ```
    - **Success (201 CREATED)**: Display "Group created successfully." Refresh the list of groups.
    - **Error (409 CONFLICT - GROUP_ALREADY_EXISTS)**: Display "A group with this name already exists."
    - **Error (400 BAD_REQUEST)**: Display "Group name and player names are required." or "Number of players out of bounds."
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.
- **API Endpoint (Update Group)**: `PUT http://localhost:8080/group/get?groupId={id}`
    - **Description**: This endpoint is planned for the current backend version. Frontend should implement the UI and logic to call this API.
    - **Request Headers**: `Authorization: Bearer <token>`
    - **Request Body**: (Backend will extract `userId` from JWT)
        ```json
        {
            "group": {
                "id": <groupId>,
                "userId": <userId_from_JWT>,
                "groupName": "Updated Group Name",
                "players": {
                    "playerNames": [
                        "Updated Player1",
                        "Updated Player2"
                    ]
                }
            }
        }
        ```
    - **Success (200 OK)**: Display "Group updated successfully." Refresh the list of groups.
    - **Error (404 NOT_FOUND - NO_GROUP_FOUND)**: Display "Group not found."
    - **Error (400 BAD_REQUEST)**: Display "Invalid group data provided."
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.
- **API Endpoint (Select Group)**: `POST http://localhost:8080/group/select`
    - **Request Headers**: `Authorization: Bearer <token>`
    - **Request Body**: `{ "id": <selectedGroupId> }`
    - **Success (200 OK)**: Display "Group selected successfully." The frontend must then immediately call `GET /game-engine/get-screen` to determine the next screen (expected to be `GAME_OPTION_SELECTION`).
    - **Error (404 NOT_FOUND - NO_GROUP_FOUND)**: Display "Selected group does not exist."
    - **Error (400 BAD_REQUEST - INVALID_GAME_STATUS)**: Display "Invalid game state for group selection."
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.

#### 3.2.6. Configuration for Group Player Limits
- **Description**: The frontend needs to fetch configuration values for minimum and maximum players allowed in a group to enforce validation during group creation/update.
- **API Endpoint**: `GET http://localhost:8080/config/get`
    - **Request Headers**: `Authorization: Bearer <token>`
    - **Expected Response**: A list of configurations, including `key: "max_player_allowed_in_group"`, `key: "min_player_allowed_in_group"`, and `key: "max_group_allowed"`.
    - **Logic**:
        - On loading the group creation/edit form, fetch these configurations.
        - Use the `value` field from the response to set validation rules for the number of players.
        - Use the `value` field for `max_group_allowed` to limit the number of groups a user can create.
    - **Error (404 NOT_FOUND - NO_CONFIG_FOUND)**: Display a default message or use hardcoded defaults if config is critical.
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.

#### 3.2.7. Game Option Selection Screen
- **Description**: Allows the user to configure game-specific options, starting with the number of spies. This screen is displayed when the `gameStatus` from `GET /game-engine/get-screen` is `GAME_OPTION_SELECTION`.
- **UI**:
    - A clear title: "Configure Game Options".
    - A section for "Number of Spies":
        - Displays the current selected number of spies.
        - "Increase" button to increment the number of spies.
        - "Decrease" button to decrement the number of spies.
        - The buttons should be disabled if the minimum or maximum limit (fetched from configuration) is reached.
        - A message should be displayed (e.g., a small pop-up or inline text) if a limit is reached upon attempting to change the value.
    - A "Start Game" or "Continue" button to proceed.
- **API Endpoint (Set Game Options)**: `POST http://localhost:8080/game-engine/game-option`
    - **Request Headers**: `Authorization: Bearer <token>`
    - **Request Body**:
        ```json
        {
            "number_of_spy": <selectedNumberOfSpies>
        }
        ```
    - **Success (200 OK)**: Display "Game options set successfully." The frontend must then immediately call `GET /game-engine/get-screen` to determine the next screen (expected to be `WORD_AND_SPY_REVEAL`).
    - **Error (400 BAD_REQUEST - INVALID_NUMBER_OF_SPY)**: Display "Invalid number of spies. Please select between X and Y." (where X and Y are min/max from config).
    - **Error (400 BAD_REQUEST - INVALID_GAME_STATUS)**: Display "Invalid game state for game option selection."
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.
- **API Endpoint (Configuration for Number of Spies)**: `GET http://localhost:8080/config/get`
    - **Request Headers**: `Authorization: Bearer <token>`
    - **Expected Response**: A list of configurations, including `key: "min_spy_allowed"` and `key: "max_spy_allowed"` (assuming these will be added).
    - **Logic**:
        - On loading the game option selection screen, fetch these configurations.
        - Use the `value` fields to set the bounds for the number of spies.
    - **Error (404 NOT_FOUND - NO_CONFIG_FOUND)**: Display a default message or use hardcoded defaults if config is critical.
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.


### 5.5. Project Structure and Modularity

To ensure maintainability, scalability, and efficient collaboration, the frontend project will adhere to a well-defined, modular folder structure, reflecting top industry-level expert practices. This approach promotes clear separation of concerns, making it easier to locate, understand, and manage different parts of the application.

A recommended structure for a modern React application would be:

```
src/
├── assets/                 # Static assets like images, fonts, icons
│   ├── images/
│   ├── fonts/
│   └── icons/
├── components/             # Reusable UI components (e.g., Button, InputField, Card)
│   ├── common/             # Highly generic components (e.g., Button, Modal, LoadingSpinner)
│   ├── auth/               # Auth-specific reusable components (e.g., AuthForm, PasswordInput)
│   └── game/               # Game-specific reusable components (e.g., PlayerCard, CategoryCard)
├── config/                 # Application-wide configurations (e.g., API endpoints, constants, feature flags)
├── hooks/                  # Custom React hooks for encapsulating reusable logic (e.g., useAuth, useGame)
├── layouts/                # Layout components (e.g., AuthLayout, GameLayout, AdminLayout)
├── pages/                  # Top-level views/screens, often corresponding to routes
│   ├── Auth/
│   │   ├── LoginPage.jsx
│   │   └── RegisterPage.jsx
│   ├── Game/
│   │   ├── InitialGameScreen.jsx
│   │   ├── CategorySelectionScreen.jsx
│   │   ├── GroupSelectionScreen.jsx
│   │   ├── GameOptionSelectionScreen.jsx
│   │   └── WordSpyRevealScreen.jsx
│   └── Admin/              # Future admin screens
├── services/               # API interaction logic, abstracting HTTP requests (e.g., authService.js, gameService.js)
├── store/                  # State management (e.g., Redux slices, Zustand stores, or Context API providers)
│   ├── authSlice.js        # Auth-related state
│   ├── gameSlice.js        # Game-related state
│   └── index.js            # Root store configuration
├── styles/                 # Global styles, themes, utility classes, and component-specific styling
│   ├── base/               # Global resets, typography
│   ├── themes/             # Dark/light themes, color variables
│   └── utils/              # Utility classes (e.g., spacing, flex helpers)
├── utils/                  # Pure utility functions (e.g., date formatting, JWT decoding, validation helpers)
├── App.jsx                 # Main application component, often handles routing
├── index.js                # Entry point for the React application
└── routes.js               # Centralized route definitions and protected routes logic
```

**Key Principles for Industry-Level Codebase:**

*   **Feature-based or Domain-based Grouping**: Components, pages, and related logic are grouped by feature or domain (e.g., `Auth`, `Game`). This enhances discoverability and reduces cognitive load.
*   **Strict Separation of Concerns**: UI components, business logic, API calls, and state management are kept in distinct layers. This makes each part easier to test, maintain, and understand independently.
*   **High Reusability**: Common UI elements and logic are developed as generic, prop-driven components and custom hooks to be reused across the application, ensuring consistency and reducing redundancy.
*   **Clear Naming Conventions**: Consistent and descriptive naming for files, folders, and variables is crucial for team collaboration and long-term maintainability.
*   **Scalability and Extensibility**: The structure is designed to easily accommodate new features, modules, and team members without becoming unwieldy or introducing significant refactoring.
*   **Testability**: The modular nature naturally lends itself to easier unit, integration, and end-to-end testing.

This robust structure will facilitate a clean, efficient, and scalable codebase, improve developer onboarding, and streamline future development efforts, aligning with best practices in professional software engineering.

#### 3.2.8. Word and Spy Reveal Screen (`WORD_AND_SPY_REVEAL`)
- **Description**: This screen guides players through revealing their roles (whether they are a spy or not) and their assigned word (for non-spies). It involves a "pass the device" mechanism to ensure each player sees their role privately. This screen is displayed when the `gameStatus` from `GET /game-engine/get-screen` is `WORD_AND_SPY_REVEAL`.
- **UI**:
    - **Common Elements**: A prominent "Continue" button to proceed to the next player's turn or the next game phase.
    - **Screen Type: `PASS_DEVICE`**:
        - Displays a clear instruction like "Pass the device to [Player Name]" (from `screenData.displayText`).
        - Visually represent a player (e.g., an avatar or icon, potentially with a placeholder image).
        - The "Continue" button should be clearly visible.
    - **Screen Type: `ROLE_REVEAL`**:
        - Displays the player's role (e.g., "You are NOT a SPY" or "You are SPY") prominently (from `screenData.displayText`).
        - Displays the player's name (from `screenData.playerDetails.playerName`).
        - **For Non-Spies (`screenData.playerDetails.isSpy: false`)**:
            - Displays the `screenData.categoryName`.
            - Displays the `screenData.wordName`.
            - Displays the `screenData.roleDescriptionText` (if provided and relevant).
        - **For Spies (`screenData.playerDetails.isSpy: true`)**:
            - Displays the `screenData.categoryName`.
            - Displays the `screenData.roleDescriptionText` (if provided and relevant, e.g., a specific spy instruction).
            - The `screenData.wordName` **must not** be displayed.
        - The "Continue" button should be clearly visible.
- **API Endpoint**: `POST http://localhost:8080/game-engine/role-reveal`
    - **Request Headers**: `Authorization: Bearer <token>`
    - **Success (200 OK)**:
        - **Response Type 1: `PASS_DEVICE`**:
            ```json
            { // Example response for PASS_DEVICE screen
                "message": "Role reveal screen loaded successfully",
                "screenData": {
                    "categoryName": "test1",
                    "displayText": "Pass the device to Sayam",
                    "isLast": false,
                    "playerDetails": {
                        "isSpy": null,
                        "playerName": "Sayam",
                        "playerNumber": 1
                    },
                    "roleDescriptionText": null,
                    "screenType": "PASS_DEVICE",
                    "wordName": "test2"
                },
                "status": "200 OK"
            }
            ```
            *   Frontend should display the `displayText` and wait for user interaction (e.g., clicking "Continue").
        - **Response Type 2: `ROLE_REVEAL` (Non-Spy)**:
            ```json
            { // Example response for ROLE_REVEAL (Non-Spy) screen
                "message": "Role reveal screen loaded successfully",
                "screenData": {
                    "categoryName": "test1",
                    "displayText": "You are NOT a SPY",
                    "isLast": false,
                    "playerDetails": {
                        "isSpy": false,
                        "playerName": "Sayam",
                        "playerNumber": 1
                    },
                    "roleDescriptionText": null,
                    "screenType": "ROLE_REVEAL",
                    "wordName": "test2"
                },
                "status": "200 OK"
            }
            ```
            *   Frontend displays the role, player name, category, and word.
        - **Response Type 3: `ROLE_REVEAL` (Spy)**:
            ```json
            { // Example response for ROLE_REVEAL (Spy) screen
                "message": "Role reveal screen loaded successfully",
                "screenData": {
                    "categoryName": "test1",
                    "displayText": "You are SPY",
                    "isLast": false,
                    "playerDetails": {
                        "isSpy": true,
                        "playerName": "Sunny",
                        "playerNumber": 2
                    },
                    "roleDescriptionText": null,
                    "screenType": "ROLE_REVEAL",
                    "wordName": "test2" // Frontend must hide this for spies
                },
                "status": "200 OK"
            }
            ```
            *   Frontend displays the role and player name. It **must hide** the `wordName` for spies.
    - **Logic**:
        - The frontend will repeatedly call this API until `screenData.isLast` is `true`.
        - Once `isLast` is `true`, the frontend should then call `GET /game-engine/get-screen` to transition to the next game phase (expected to be `DISCUSSION_TIME`).
    - **Error (400 BAD_REQUEST - INVALID_GAME_STATUS)**: Display "Invalid game state for role reveal."
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.

#### 3.2.9. Discussion Time Screen (`DISCUSSION_TIME`)
- **Description**: This screen is for the discussion phase of the game. A timer is displayed, and players discuss to find the spy. This screen is displayed when the `gameStatus` from `GET /game-engine/get-screen` is `DISCUSSION_TIME`.
- **UI**:
    - A clear title: "Discussion Time".
    - A prominent countdown timer.
    - A list of players, possibly with their status (e.g., "In Game").
- **Logic**:
    - When this screen loads, the frontend receives `discussionStartTime` from the `GET /game-engine/get-screen` API.
    - The frontend also needs to fetch the `discussion_duration` from the `GET /config/get` endpoint.
    - The countdown timer's end time is calculated as `discussionStartTime + (discussion_duration * 1000)`.
    - The timer should display the remaining time by calculating the difference between the end time and the current time.
    - Once the timer reaches zero, the frontend should start polling the `GET /game-engine/get-screen` API every 1 second.
    - Polling continues until the `gameStatus` changes, expecting to transition to the `VOTING` screen.
- **API Endpoint (`get-screen`)**: `GET http://localhost:8080/game-engine/get-screen`
    - **Request Headers**: `Authorization: Bearer <token>`
    - **Success (200 OK) with `DISCUSSION_TIME` status**:
        ```json
        {
            "data": {
                "discussionStartTime": 1772825506080
            },
            "gameStatus": "DISCUSSION_TIME",
            "message": "Game Status loaded successfully",
            "status": "200 OK"
        }
        ```
    - **Error Handling**: Standard error handling applies as with other `get-screen` calls.
- **API Endpoint (Configuration)**: `GET http://localhost:8080/config/get`
    - **Logic**: Fetch the configuration with `key: "discussion_duration"` to calculate the timer.



## 4. Non-Functional Requirements

### 4.1. Performance
- The application should be highly responsive, with fast loading times and smooth UI transitions.
- All API calls should be asynchronous to prevent UI blocking.

### 4.2. Security
- **JWT Handling**: The JWT token received upon login/registration must be securely stored client-side (e.g., `localStorage` for convenience, but `HttpOnly` cookies are more secure for production environments). The frontend will be responsible for extracting the `userId` from the JWT token.
- **Authorization Header**: All authenticated API requests must include the `Authorization: Bearer <token>` header.
- **User ID Header**: The `X-User-Id` header must be included in relevant API requests, with the `userId` extracted from the JWT.
- **Role-Based Access Control**: The frontend should extract the user's `role` from the JWT to conditionally render UI elements or restrict access to certain routes (e.g., for ADMIN screens).

### 4.3. Error Handling
- **Specific Error Messages**: For known API error codes (e.g., 409, 401, 404), display user-friendly and specific error messages as detailed in the functional requirements.
- **Generic 500 Error**: Any `500 Internal Server Error` from the backend should trigger a small, non-blocking pop-up/toast notification with a red background, displaying "Internal Server Error". This pop-up should be dismissible or auto-hide after a few seconds.
- **Network Errors**: Handle network connectivity issues gracefully (e.g., "No internet connection").

## 5. Technical Considerations

### 5.1. Frontend Framework/Library
- A modern, component-based JavaScript framework (e.g., React, Vue.js, Angular) is recommended for building the UI. For this project, **React** is the chosen framework.

### 5.2. State Management
- A robust state management solution (e.g., Redux, Vuex, Zustand, React Context API with `useReducer`) should be used to manage application-wide state, including authentication status, user data, and game progress.

### 5.3. API Integration
- Use a library like Axios for making HTTP requests.
- Implement request interceptors to automatically attach the `Authorization` and `X-User-Id` headers (after extracting `userId` from the JWT).
- Implement response interceptors to handle global error conditions (e.g., 401 unauthorized, 500 internal server error) and potentially refresh tokens if applicable.

### 5.4. Routing
- Implement client-side routing to manage navigation between different application views (e.g., `/login`, `/register`, `/game`, `/game/category-selection`).

## 6. Future Considerations (ADMIN Screen)
- The frontend architecture should be designed to easily accommodate an ADMIN screen in the future. This implies:
    - **Role-Based Access Control (RBAC)**: Implement logic to conditionally render UI elements or restrict access to certain routes based on the user's role (e.g., 'USER' vs. 'ADMIN'), which can be extracted from the JWT token.
    - **Modular Design**: Keep admin-specific components and logic separate from user-facing components.

## 7. Backend API Endpoints (Summary for Frontend Reference)

### Authentication
- `POST http://localhost:8080/auth/register`: User registration.
- `POST http://localhost:8080/auth/login`: User login.
- `POST http://localhost:8080/auth/logout`: User logout.

### Game Engine
- `POST http://localhost:8080/game-engine/reset`: Resets the current game for the user.
- `GET http://localhost:8080/game-engine/get-screen`: Retrieves the current game screen/status for the user.
- `POST http://localhost:8080/game-engine/role-reveal`: Advances the role reveal process for each player.
- `POST http://localhost:8080/game-engine/game-option`: Sets game options like the number of spies.

### Group Management
- `GET http://localhost:8080/group/get`: Retrieves all available groups or a specific group.
- `POST http://localhost:8080/group/create`: Creates a new group.
- `PUT http://localhost:8080/group/get?groupId={id}`: Updates an existing group.
- `POST http://localhost:8080/group/select`: Selects a group for the current game.

### Category Management
- `GET http://localhost:8080/category/get`: Retrieves all available categories.
- `POST http://localhost:8080/category/select`: Selects a category for the current game.

### Configuration
- `GET http://localhost:8080/config/get`: Retrieves application configurations (e.g., player limits, spy limits, group limits).

---

## Backend Enhancements Needed for Current Scope

Based on the frontend requirements, the following enhancement is necessary for a smooth frontend integration:


1.  **`GET /game-engine/get-screen` Endpoint**:
    - **Necessity**: Critical for the frontend to determine the current game state and navigate to the correct screen after login or a game reset. This endpoint is mentioned in the prompt but is not explicitly present in the provided `GameEngineService.java` or its corresponding controller.
    - **Recommendation**: Implement a new public method in `GameEngineService` (e.g., `getCurrentScreenData(Long userId)`) that fetches `UserGameDetail` and returns a DTO containing `gameStatus` and potentially `ScreenData` (if `ScreenData` can be built without player-specific details at this stage, or a simpler DTO for initial screen determination). This method would then be exposed via a new `GET /game-engine/get-screen` endpoint in a controller. The response should ideally contain enough information for the frontend to render the appropriate screen (e.g., if `gameStatus` is `CATEGORY_SELECTION`, it might include a list of categories or a flag to fetch them).
    - **Note**: The `userId` for this endpoint should be extracted from the JWT token by the backend.

2.  **`PUT /group/get?groupId={id}` Endpoint Implementation**:
    - **Necessity**: The frontend requires an API to update group details (name, players). The prompt states this is not yet integrated but will be in this version.
    - **Recommendation**: Implement the `PUT /group/get?groupId={id}` endpoint in the backend to handle updating group information. This would likely involve a new method in `GroupService` that takes a `groupId` and a `GroupRequest` (or a similar DTO) to update the corresponding `Group` entity.
    - **Note**: The `userId` for this endpoint should be extracted from the JWT token by the backend.

3.  **Configuration Endpoints for Game Logic**:
    - **Necessity**: The frontend needs to dynamically fetch configuration values for game rules.
    - **Recommendation**: Ensure the `GET http://localhost:8080/config/get` endpoint provides the following keys:
        - `min_player_allowed_in_group`: Minimum number of players allowed in a group.
        - `max_player_allowed_in_group`: Maximum number of players allowed in a group.
        - `max_group_allowed`: Maximum number of groups a user can create.
        - `min_spy_allowed`: Minimum number of spies allowed in a game.
        - `max_spy_allowed`: Maximum number of spies allowed in a game.
        - `discussion_duration`: Duration for the discussion phase in seconds.
    - **Note**: The `userId` for this endpoint should be extracted from the JWT token by the backend.

4.  **`roleDescriptionText` for Spies**:
    - **Necessity**: The current `ROLE_REVEAL` response for spies has `roleDescriptionText: null`. To provide a richer experience, especially for future features like a "spy word," this field should be populated.
    - **Recommendation**: The backend should populate `screenData.roleDescriptionText` for spies with relevant instructions or a specific "spy word" if that feature is implemented.

5.  **`categoryName` for Spies**:
    - **Necessity**: The current `ROLE_REVEAL` response for spies includes `categoryName`. While not strictly problematic, in some game variations, the spy might not know the category.
    - **Recommendation**: Consider if `categoryName` should be `null` or empty for spies in the `ROLE_REVEAL` screenData, depending on the desired game mechanics. If the spy should know the category, it's fine as is. If not, the backend should adjust this.
