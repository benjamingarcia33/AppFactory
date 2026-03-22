import { db } from "@/lib/db";
import { screenPatterns } from "./schema";
import { v4 as uuid } from "uuid";

/**
 * Idempotent seed function for the screen patterns knowledge base.
 * Uses ON CONFLICT DO NOTHING so it can be run multiple times safely.
 */
export async function seedScreenPatterns() {
  const now = new Date().toISOString();

  const patterns = [
    // ============================================
    // 1. Login (auth)
    // ============================================
    {
      id: uuid(),
      name: "Login",
      slug: "login",
      category: "auth",
      description:
        "Standard login screen with email/password fields, OAuth provider buttons, and links to signup and password recovery.",
      layoutPattern: "centered-card",
      layoutDescription:
        "Vertically centered card on a branded background. App logo at top, followed by email and password input fields, a primary 'Log In' button, OAuth divider with provider buttons (Google, Apple), and footer links to 'Sign Up' and 'Forgot Password'.",
      interactionsJson: JSON.stringify([
        "Tap email field to focus and enter email with keyboard validation",
        "Tap password field to enter password with show/hide toggle",
        "Tap 'Log In' button to submit credentials",
        "Tap OAuth provider button to initiate third-party auth flow",
        "Tap 'Forgot Password' link to navigate to password reset",
        "Tap 'Sign Up' link to navigate to registration screen",
        "Swipe down to dismiss keyboard on mobile",
      ]),
      statesJson: JSON.stringify({
        idle: "Form fields empty, ready for user input with placeholder text",
        loading:
          "Spinner on the 'Log In' button, all inputs disabled during authentication request",
        error:
          "Inline error messages below fields for validation errors; toast or banner for server errors like invalid credentials",
        success:
          "Brief success indicator before redirecting to the home dashboard",
        "oauth-loading":
          "Dimmed overlay with spinner while OAuth provider flow is in progress",
      }),
      requiredTechCategoriesJson: JSON.stringify(["auth"]),
      optionalTechCategoriesJson: JSON.stringify(["analytics"]),
      stateApproach: "local",
      dataFlowDescription:
        "Reads nothing on mount. Writes email and password to auth provider on submit. On success, receives auth token/session which is stored globally (context or cookie). On failure, displays server error message. OAuth flow delegates to third-party provider and receives callback with auth credentials.",
      navigatesToJson: JSON.stringify([
        "signup",
        "home-dashboard",
        "onboarding-flow",
      ]),
      navigatesFromJson: JSON.stringify([
        "signup",
        "pricing-paywall",
      ]),
      promptFragment:
        "Build a login screen with a vertically centered card layout on a subtle branded background. Place the app logo at the top of the card, followed by email and password text input fields with proper keyboard types and autocomplete attributes. The password field should include a show/hide toggle icon. Below the fields, add a full-width primary 'Log In' button that shows a spinner while authenticating and disables all inputs during the request. Add a divider with 'or continue with' text, then OAuth buttons for Google and Apple side by side. Below the card, include 'Forgot Password?' and 'Don't have an account? Sign Up' links. Display inline validation errors under each field (email format, password required). Show a toast notification for server-side errors such as invalid credentials or account locked. On successful login, redirect to the home dashboard or onboarding flow for new users. Handle the empty state with placeholder text in fields and ensure all touch targets meet minimum 44x44pt size.",
      platforms: "both",
      verified: true,
      createdAt: now,
    },

    // ============================================
    // 2. Signup (auth)
    // ============================================
    {
      id: uuid(),
      name: "Signup",
      slug: "signup",
      category: "auth",
      description:
        "Registration screen with name, email, password fields, password strength indicator, terms acceptance, and OAuth signup options.",
      layoutPattern: "centered-card",
      layoutDescription:
        "Vertically centered card with app logo, name/email/password fields stacked vertically, a password strength meter below the password field, a terms-of-service checkbox, primary 'Create Account' button, OAuth divider with provider buttons, and a footer link to the login screen.",
      interactionsJson: JSON.stringify([
        "Tap name field to enter display name",
        "Tap email field to enter email address",
        "Tap password field to enter password; strength meter updates in real-time",
        "Tap show/hide toggle to reveal or mask password",
        "Tap terms checkbox to accept terms of service",
        "Tap 'Create Account' button to submit registration",
        "Tap OAuth button to sign up via Google or Apple",
        "Tap 'Already have an account? Log In' to navigate to login",
      ]),
      statesJson: JSON.stringify({
        idle: "Empty form with placeholder text and disabled submit button until all required fields are filled",
        validating:
          "Real-time inline validation as user types: email format, password strength meter updating",
        loading:
          "Spinner on 'Create Account' button with all inputs disabled during registration",
        error:
          "Inline field errors for validation; toast for server errors like 'email already in use'",
        success:
          "Success message with redirect to email verification or onboarding flow",
      }),
      requiredTechCategoriesJson: JSON.stringify(["auth", "database"]),
      optionalTechCategoriesJson: JSON.stringify(["analytics"]),
      stateApproach: "local",
      dataFlowDescription:
        "Reads nothing on mount. Collects name, email, and password from form inputs. Validates fields locally before sending to auth provider. On success, a new user record is created in the database with profile defaults, and an auth session is established. May trigger a verification email. Redirects to onboarding flow or home dashboard.",
      navigatesToJson: JSON.stringify([
        "login",
        "onboarding-flow",
        "home-dashboard",
      ]),
      navigatesFromJson: JSON.stringify(["login"]),
      promptFragment:
        "Build a signup screen using a centered card layout. At the top, display the app logo and a welcoming headline like 'Create your account'. Stack three input fields vertically: display name, email (with email keyboard type), and password (with show/hide toggle). Below the password field, render a password strength meter that updates as the user types, showing weak/medium/strong with color coding (red/yellow/green). Add a checkbox for 'I agree to the Terms of Service and Privacy Policy' with tappable links to each document. The 'Create Account' button should remain disabled until all fields are valid and terms are accepted. On tap, show a loading spinner, disable inputs, and submit to the auth provider. Display inline validation errors under each field for issues like invalid email format or password too short. Show a toast for server errors such as duplicate email. Below the form, add an OAuth divider with Google and Apple signup buttons. At the bottom, include a 'Already have an account? Log In' link. On successful registration, redirect to the onboarding flow. Ensure the form scrolls properly on small screens and respects safe area insets.",
      platforms: "both",
      verified: true,
      createdAt: now,
    },

    // ============================================
    // 3. Onboarding Flow (auth)
    // ============================================
    {
      id: uuid(),
      name: "Onboarding Flow",
      slug: "onboarding-flow",
      category: "auth",
      description:
        "Multi-step onboarding wizard that introduces key features, collects user preferences, and personalizes the initial app experience.",
      layoutPattern: "full-screen-stepper",
      layoutDescription:
        "Full-screen pages with a progress indicator (dots or bar) at the top. Each step occupies the full viewport with an illustration or graphic in the upper half, a headline and description in the middle, and action buttons at the bottom. Steps include welcome, feature highlights, preference selection, and a final 'Get Started' step.",
      interactionsJson: JSON.stringify([
        "Swipe left/right or tap next/back buttons to navigate between steps",
        "Tap preference chips or checkboxes to select interests and preferences",
        "Tap 'Skip' button to skip individual steps or the entire onboarding",
        "Tap 'Get Started' on the final step to enter the main app",
        "Tap on feature highlight cards to learn more about specific features",
      ]),
      statesJson: JSON.stringify({
        "step-welcome":
          "Full-screen welcome with app name, tagline, illustration, and 'Get Started' button",
        "step-features":
          "Swipeable feature highlight cards showing key app capabilities with illustrations",
        "step-preferences":
          "Grid of selectable preference chips or cards for personalizing the experience",
        "step-complete":
          "Summary of selections with a 'Let's Go' button leading to the personalized home screen",
        loading:
          "Brief loading spinner while saving preferences and preparing the personalized experience",
        error:
          "Toast notification if preferences fail to save, with a 'Retry' button on the final step",
      }),
      requiredTechCategoriesJson: JSON.stringify(["auth", "database"]),
      optionalTechCategoriesJson: JSON.stringify(["analytics", "storage"]),
      stateApproach: "local",
      dataFlowDescription:
        "Reads the current user's profile to check if onboarding is already completed. Each step collects preferences locally in component state. On the final step, all collected preferences are written to the user profile in the database in a single batch. Sets an 'onboardingCompleted' flag on the user profile. Subsequent app launches check this flag and skip directly to the home dashboard.",
      navigatesToJson: JSON.stringify(["home-dashboard"]),
      navigatesFromJson: JSON.stringify(["login", "signup"]),
      promptFragment:
        "Build a 3-4 step onboarding flow displayed as full-screen pages with smooth horizontal slide transitions. Step 1 is a welcome screen with the app logo, a compelling headline, a short description of the app's value, and a 'Get Started' button. Steps 2-3 collect user preferences using tappable chips arranged in a responsive grid, allowing multi-select. Examples include interest categories, experience level, or usage goals. The final step shows a summary of selected preferences and a prominent 'Let's Go' button. Include a progress indicator at the top showing the current step as dots or a progress bar. Every step except the final one includes a 'Skip' link in the top-right corner. Store all preferences in local state during the flow and write them to the user's database profile in one batch on completion. Set an 'onboardingCompleted' flag so returning users skip directly to the home dashboard. Ensure illustrations or icons accompany each step for visual appeal, and animations between steps feel polished and responsive.",
      platforms: "both",
      verified: true,
      createdAt: now,
    },

    // ============================================
    // 4. Home Dashboard (core)
    // ============================================
    {
      id: uuid(),
      name: "Home Dashboard",
      slug: "home-dashboard",
      category: "core",
      description:
        "Primary landing screen showing personalized summary metrics, recent activity, quick actions, and an overview of key app data.",
      layoutPattern: "scrollable-sections",
      layoutDescription:
        "Top section with a greeting header and user avatar. Below that, a horizontal row of 2-4 summary metric cards. Middle section with a featured or highlighted content area. Lower section with a vertical list of recent activity or items. A floating action button or quick-action bar at the bottom for primary actions.",
      interactionsJson: JSON.stringify([
        "Pull down to refresh all dashboard data",
        "Tap a metric card to navigate to the detailed view for that metric",
        "Tap a recent activity item to view its details",
        "Tap the floating action button to create a new item",
        "Scroll vertically through dashboard sections",
        "Tap user avatar to navigate to profile screen",
        "Swipe horizontally on the metric cards row if more than 3 cards",
      ]),
      statesJson: JSON.stringify({
        loading:
          "Skeleton shimmer placeholders for metric cards, featured content, and activity list",
        populated:
          "All sections filled with user-specific data including metrics with trend indicators",
        empty:
          "Welcome message with onboarding prompts and suggested first actions when no data exists yet",
        error:
          "Error banner at top with 'Retry' button; cached data shown below if available",
        offline:
          "Stale data displayed with an 'Offline' indicator badge and last-updated timestamp",
      }),
      requiredTechCategoriesJson: JSON.stringify(["database", "auth"]),
      optionalTechCategoriesJson: JSON.stringify([
        "analytics",
        "realtime",
        "push-notifications",
      ]),
      stateApproach: "server-state",
      dataFlowDescription:
        "Reads user profile for personalization (greeting, avatar). Fetches aggregated metrics from the database (counts, sums, averages). Reads recent activity items sorted by timestamp descending. All data is fetched in parallel on mount using server-side queries or React Query. Pull-to-refresh triggers a full data refetch. Metric card taps navigate to detail screens passing filter parameters via URL. Does not write data directly; creation flows happen on separate screens.",
      navigatesToJson: JSON.stringify([
        "profile",
        "settings",
        "detail-view",
        "creation-editor",
        "notification-center",
        "search-browse",
      ]),
      navigatesFromJson: JSON.stringify([
        "login",
        "signup",
        "onboarding-flow",
      ]),
      promptFragment:
        "Build a home dashboard as the app's main landing screen. Start with a header showing a personalized greeting ('Good morning, [Name]') and the user's avatar that links to the profile. Below, display 2-4 summary metric cards in a horizontal scrollable row, each showing a label, a large number, and a trend indicator (up/down arrow with percentage change). The cards should use distinct accent colors or icons. Next, add a featured content section, such as a highlighted item, daily tip, or promoted action. Below that, render a vertical list of recent activity items, each with an icon, description, timestamp, and a chevron for navigation. Include a floating action button in the bottom-right corner for the primary creation action. All data sections should load in parallel with skeleton shimmer placeholders. Support pull-to-refresh to reload all data. When the user has no data yet, show an engaging empty state with illustration and suggested first actions. Handle error states with a dismissible banner and retry option.",
      platforms: "both",
      verified: true,
      createdAt: now,
    },

    // ============================================
    // 5. Settings (core)
    // ============================================
    {
      id: uuid(),
      name: "Settings",
      slug: "settings",
      category: "core",
      description:
        "Grouped settings screen for managing profile, notifications, appearance, privacy, and account options with immediate-save toggles.",
      layoutPattern: "grouped-list",
      layoutDescription:
        "Scrollable list of grouped sections, each with a section header and rows of setting items. Each row has a label, optional description, and a control (toggle switch, chevron for drill-down, or value display). Sections include Profile, Notifications, Appearance, Privacy, and Account. Destructive actions (logout, delete account) are at the bottom in a distinct style.",
      interactionsJson: JSON.stringify([
        "Tap toggle switch to immediately save a boolean preference",
        "Tap a row with chevron to drill into a sub-settings screen",
        "Tap profile row to edit profile information",
        "Tap theme selector to switch between light, dark, and system themes",
        "Tap 'Log Out' to sign out with confirmation dialog",
        "Tap 'Delete Account' to initiate account deletion with confirmation",
        "Scroll vertically through settings sections",
      ]),
      statesJson: JSON.stringify({
        loading:
          "Skeleton placeholders for settings values while preferences load from the server",
        populated:
          "All settings displayed with current values; toggles reflect saved state",
        saving:
          "Subtle spinner or checkmark animation next to the changed setting during save",
        error:
          "Toast notification if a setting fails to save, with the toggle reverting to its previous state",
      }),
      requiredTechCategoriesJson: JSON.stringify(["auth", "database"]),
      optionalTechCategoriesJson: JSON.stringify([
        "push-notifications",
        "analytics",
      ]),
      stateApproach: "hybrid",
      dataFlowDescription:
        "Reads user profile and preferences from the database on mount. Toggle changes trigger an immediate optimistic update to local state and an async write to the database. If the write fails, the toggle reverts and a toast error is shown. Theme changes update the global theme context immediately. Profile edits open a sub-screen or modal that writes back to the user profile on save. Logout clears the auth session and redirects to login. Account deletion triggers a server-side cascade delete.",
      navigatesToJson: JSON.stringify(["profile", "login"]),
      navigatesFromJson: JSON.stringify(["home-dashboard", "profile"]),
      promptFragment:
        "Build a settings screen organized into clearly labeled sections with a grouped list layout. Profile section: tappable row showing the user's avatar, name, and email that navigates to a profile edit sub-screen. Notifications section: toggle switches for each notification category (e.g., push notifications, email updates, marketing) that save immediately on toggle with an optimistic update. Appearance section: a theme selector offering Light, Dark, and System options with instant visual preview. Privacy section: toggles for analytics opt-in, data sharing preferences, and a link to the privacy policy. Account section: rows for 'Change Password', 'Export My Data', and 'Delete Account'. The delete action should show a confirmation dialog requiring the user to type 'DELETE' to confirm. Include a 'Log Out' button at the very bottom styled in a destructive color. All toggles use optimistic updates with rollback on failure and a brief toast notification. Load all current preference values from the server on mount with skeleton placeholders.",
      platforms: "both",
      verified: true,
      createdAt: now,
    },

    // ============================================
    // 6. Profile (core)
    // ============================================
    {
      id: uuid(),
      name: "Profile",
      slug: "profile",
      category: "core",
      description:
        "User profile screen displaying personal information, avatar, stats, and user-generated content with edit capabilities.",
      layoutPattern: "header-with-scrollable-content",
      layoutDescription:
        "A large header area with the user's avatar (centered), display name, and a short bio or tagline. Below the header, a row of stat counters (e.g., posts, followers, following). Underneath, a tab bar or segmented control to switch between different content views (posts, favorites, activity). The content area below the tabs is a scrollable list or grid of items.",
      interactionsJson: JSON.stringify([
        "Tap avatar to change profile photo via camera or photo library picker",
        "Tap 'Edit Profile' button to enter edit mode for name, bio, and other fields",
        "Tap stat counter to navigate to the corresponding list (e.g., followers list)",
        "Tap segment/tab to switch between content views",
        "Scroll vertically through the content list with infinite scroll",
        "Pull down to refresh profile data and content",
        "Long press on own content item for edit/delete options",
      ]),
      statesJson: JSON.stringify({
        loading:
          "Skeleton for avatar, name, stats, and content list while profile data loads",
        populated:
          "Full profile with avatar, stats, and content list populated",
        editing:
          "Edit mode with inline text fields for name and bio, save/cancel buttons replacing the edit button",
        "empty-content":
          "Placeholder message in the content area when the user has no posts or items yet",
        "other-user":
          "Viewing another user's profile with a 'Follow' button instead of 'Edit Profile'",
        error:
          "Error message with retry button if profile data fails to load; toast for save failures in edit mode",
      }),
      requiredTechCategoriesJson: JSON.stringify(["auth", "database"]),
      optionalTechCategoriesJson: JSON.stringify([
        "storage",
        "analytics",
      ]),
      stateApproach: "server-state",
      dataFlowDescription:
        "Reads user profile data (name, avatar URL, bio, stats) from the database on mount. If viewing own profile, enables edit mode. Avatar changes upload the new image to cloud storage and update the avatar URL in the user profile. Name and bio edits write directly to the user profile. Content tabs fetch user-specific content (posts, favorites) with cursor-based pagination. Stat counters are aggregated from related tables. Viewing another user's profile reads their public profile data and checks the follow relationship.",
      navigatesToJson: JSON.stringify([
        "settings",
        "detail-view",
        "creation-editor",
      ]),
      navigatesFromJson: JSON.stringify(["home-dashboard", "settings"]),
      promptFragment:
        "Build a profile screen with a prominent header section containing a large circular avatar (tappable to change photo), the user's display name in bold, and a short bio or tagline below it. Add an 'Edit Profile' button near the top-right. Below the header, display a row of stat counters (e.g., '12 Posts | 148 Followers | 95 Following') where each counter is tappable to navigate to the detailed list. Add a segmented control or tab bar to switch between content views such as 'Posts', 'Favorites', and 'Activity'. The content area below renders items in a scrollable list or grid with infinite scroll pagination. In edit mode, the name and bio become inline editable text fields with 'Save' and 'Cancel' buttons. Avatar editing opens a bottom sheet with options: 'Take Photo', 'Choose from Library', and 'Remove Photo'. When viewing another user's profile, replace the 'Edit Profile' button with a 'Follow/Unfollow' toggle button. Show a skeleton loading state for all sections on initial load, and support pull-to-refresh.",
      platforms: "both",
      verified: true,
      createdAt: now,
    },

    // ============================================
    // 7. Content Feed (content)
    // ============================================
    {
      id: uuid(),
      name: "Content Feed",
      slug: "content-feed",
      category: "content",
      description:
        "Vertically scrolling feed of content cards with like/comment interactions, infinite scroll, pull-to-refresh, and content creation entry point.",
      layoutPattern: "infinite-scroll-list",
      layoutDescription:
        "A top header with the feed title or filter/sort controls. The main area is a vertically scrolling list of content cards, each containing author info (avatar, name, timestamp), content body (text, images, or media), and an interaction bar (like, comment, share buttons with counts). A floating action button for creating new content. Pull-to-refresh at the top, infinite scroll loader at the bottom.",
      interactionsJson: JSON.stringify([
        "Scroll vertically to browse feed items with infinite scroll loading",
        "Pull down to refresh and load newest content",
        "Tap like button to toggle like with optimistic update and animation",
        "Tap comment button to expand inline comment section or navigate to detail",
        "Tap share button to open native share sheet",
        "Tap author avatar or name to navigate to their profile",
        "Tap content card body to navigate to detail view",
        "Tap floating action button to create new content",
        "Double-tap content image to like (Instagram-style)",
      ]),
      statesJson: JSON.stringify({
        loading:
          "Skeleton shimmer cards (3-4 visible) mimicking the card layout while feed loads",
        populated:
          "Feed filled with content cards in chronological or ranked order",
        empty:
          "Illustration with message like 'Nothing here yet' and suggestions to follow people or create content",
        "loading-more":
          "Small spinner at the bottom of the list while fetching the next page",
        "end-of-feed":
          "Subtle message like 'You're all caught up' when no more content to load",
        error:
          "Error message with retry button; any cached content still visible above",
      }),
      requiredTechCategoriesJson: JSON.stringify(["database", "auth"]),
      optionalTechCategoriesJson: JSON.stringify([
        "storage",
        "realtime",
        "analytics",
      ]),
      stateApproach: "server-state",
      dataFlowDescription:
        "Reads content items from the database with cursor-based pagination (10-20 items per page). Each item includes author profile data (joined), like count, comment count, and whether the current user has liked it. Likes are written optimistically: local state updates immediately, then a server request toggles the like. Pull-to-refresh fetches items newer than the first visible item's timestamp. Infinite scroll triggers when the user nears the bottom, fetching the next page using the last item's cursor. New content creation navigates to the creation-editor screen and appends the new item to the top of the feed on return.",
      navigatesToJson: JSON.stringify([
        "detail-view",
        "profile",
        "creation-editor",
        "chat-messaging",
      ]),
      navigatesFromJson: JSON.stringify(["home-dashboard", "search-browse"]),
      promptFragment:
        "Build a content feed screen with a vertically scrolling list of content cards. Each card displays the author's avatar and name (tappable to visit profile), a relative timestamp ('2h ago'), the content body (supporting text and optional images), and an interaction bar with like, comment, and share buttons showing counts. Implement cursor-based infinite scroll: load 15 items initially, then fetch the next page when the user scrolls within 3 items of the bottom, using Intersection Observer. Add pull-to-refresh at the top that fetches content newer than the newest visible item. Likes should use optimistic updates with a brief heart animation on tap. The comment button expands an inline comment section showing the 2 most recent comments with a 'View all' link to the detail view. Include a floating action button in the bottom-right for creating new content. Show skeleton shimmer cards during initial load, a spinner during page loads, and a 'You're all caught up' message at the end. Handle empty feed state with an engaging illustration and call-to-action.",
      platforms: "both",
      verified: true,
      createdAt: now,
    },

    // ============================================
    // 8. Detail View (content)
    // ============================================
    {
      id: uuid(),
      name: "Detail View",
      slug: "detail-view",
      category: "content",
      description:
        "Full detail screen for viewing a single content item with complete information, media display, comments thread, and related items.",
      layoutPattern: "sticky-header-scroll",
      layoutDescription:
        "A collapsible header with a hero image or media carousel that shrinks on scroll. Below the header, the content title, author info, metadata (date, category, read time), and the full content body. A comments section follows with an input field pinned to the bottom of the screen. Related or suggested items appear at the very bottom.",
      interactionsJson: JSON.stringify([
        "Scroll vertically through the content with parallax header effect",
        "Tap header image to view in full-screen lightbox",
        "Swipe left/right on image carousel to browse multiple images",
        "Tap like/bookmark buttons in the sticky action bar",
        "Tap comment input to focus and type a comment",
        "Tap 'Send' to post a comment with optimistic insertion",
        "Tap author name to navigate to their profile",
        "Tap a related item to navigate to its detail view",
        "Tap back button or swipe from left edge to navigate back",
        "Tap share button to open native share sheet with deep link",
      ]),
      statesJson: JSON.stringify({
        loading:
          "Skeleton placeholder for hero image, title, body text, and comments section",
        populated:
          "Full content displayed with all metadata, comments loaded, and related items shown",
        error:
          "Error message with retry button if content fails to load; 404 screen if item not found",
        "commenting-loading":
          "Optimistically inserted comment shown with a subtle sending indicator",
        "media-lightbox":
          "Full-screen overlay displaying the tapped image with pinch-to-zoom and swipe-to-dismiss",
      }),
      requiredTechCategoriesJson: JSON.stringify(["database"]),
      optionalTechCategoriesJson: JSON.stringify([
        "storage",
        "realtime",
        "auth",
      ]),
      stateApproach: "server-state",
      dataFlowDescription:
        "Reads the full content item by ID from the database, including author profile, all media URLs, and full body text. Fetches comments for this item separately with pagination (newest first or oldest first). Reads related items based on category or tags. Like and bookmark states are read for the current user. Writing a comment inserts a new row linked to the content item and the current user. Like/bookmark toggles write to junction tables. View count may be incremented on load. All reads happen in parallel on mount.",
      navigatesToJson: JSON.stringify(["profile", "creation-editor"]),
      navigatesFromJson: JSON.stringify([
        "content-feed",
        "search-browse",
        "home-dashboard",
        "notification-center",
      ]),
      promptFragment:
        "Build a detail view screen for displaying a single content item in full. Start with a hero image or media carousel at the top that collapses with a parallax effect on scroll, shrinking into a compact sticky header showing the title. Below the hero, display the content title in large bold text, author info (avatar, name, tappable to profile), and metadata (posted date, category tags, read time estimate). Render the full content body with rich text support including headings, paragraphs, images, and code blocks if applicable. Below the content, display a comments section header with comment count, followed by a threaded list of comments (avatar, name, timestamp, text). Pin a comment input field to the bottom of the screen with a send button. New comments should appear optimistically at the top of the list. Add a sticky action bar (below the header when scrolled) with like, bookmark, and share buttons. At the very bottom, show a 'Related Items' section with 3-4 horizontally scrollable cards. Support image lightbox on tap with pinch-to-zoom. Show skeleton loading states and handle 404 gracefully.",
      platforms: "both",
      verified: true,
      createdAt: now,
    },

    // ============================================
    // 9. Creation/Editor (content)
    // ============================================
    {
      id: uuid(),
      name: "Creation/Editor",
      slug: "creation-editor",
      category: "content",
      description:
        "Content creation and editing screen with text input, media attachment, category/tag selection, preview mode, and draft saving.",
      layoutPattern: "full-screen-editor",
      layoutDescription:
        "A top toolbar with 'Cancel' (left) and 'Publish/Save' (right) buttons plus a character/word count. The main area is a scrollable form with a title input field, a rich text body editor or multiline text area, a media attachment section with add buttons and thumbnail previews, and category/tag selector chips. An optional bottom toolbar with formatting controls (bold, italic, list, link).",
      interactionsJson: JSON.stringify([
        "Tap title field to enter or edit the content title",
        "Tap body area to enter or edit the content text",
        "Tap formatting buttons to apply bold, italic, or list formatting",
        "Tap 'Add Photo' button to attach images from camera or photo library",
        "Tap attached image thumbnail to preview or remove it",
        "Tap category chips to select or deselect categories/tags",
        "Tap 'Preview' to toggle between edit and preview modes",
        "Tap 'Publish' to submit the content",
        "Tap 'Cancel' to discard with confirmation if unsaved changes exist",
        "Swipe down or tap outside keyboard to dismiss keyboard",
      ]),
      statesJson: JSON.stringify({
        empty:
          "Blank form with placeholder text in title and body fields, ready for input",
        editing:
          "Form with user input; autosave indicator showing 'Draft saved' periodically",
        previewing:
          "Read-only rendered preview of the content as it will appear when published",
        uploading:
          "Progress indicator on media thumbnails while images are being uploaded",
        publishing:
          "Full-screen loading overlay with spinner and 'Publishing...' text",
        error:
          "Toast notification for save/publish errors with the draft preserved locally",
      }),
      requiredTechCategoriesJson: JSON.stringify(["database", "auth"]),
      optionalTechCategoriesJson: JSON.stringify([
        "storage",
        "ai",
      ]),
      stateApproach: "local",
      dataFlowDescription:
        "Reads existing content data if editing (title, body, media, tags populated from database). In create mode, starts with empty form. Media attachments are uploaded to cloud storage immediately on selection, returning URLs stored in local state. Draft content is autosaved to local storage every 30 seconds. On publish, all form data (title, body, media URLs, categories) is written to the database as a new content item or updates an existing one. On cancel, if there are unsaved changes, a confirmation dialog offers to save as draft or discard.",
      navigatesToJson: JSON.stringify(["detail-view", "content-feed"]),
      navigatesFromJson: JSON.stringify([
        "content-feed",
        "home-dashboard",
        "profile",
      ]),
      promptFragment:
        "Build a content creation/editor screen with a clean, distraction-free layout. Place 'Cancel' and 'Publish' buttons in the top toolbar, with the Publish button disabled until a title and body are provided. Show a character or word count in the toolbar. The form starts with a large title input (placeholder: 'Title') followed by a multiline body area (placeholder: 'Write your content...'). Include a media attachment section with an 'Add Photo' button that opens a bottom sheet with 'Take Photo' and 'Choose from Library' options. Show attached images as removable thumbnails in a horizontal scroll row. Add a category/tag selector using tappable chips below the media section. Implement autosave to local storage every 30 seconds with a subtle 'Draft saved' indicator. Include a 'Preview' toggle that renders the content in read-only mode as it will appear when published. On publish, show a brief full-screen loading state and then navigate to the published detail view. On cancel with unsaved changes, show a confirmation dialog: 'Save Draft', 'Discard', or 'Keep Editing'. Support editing existing content by pre-populating all fields from the database.",
      platforms: "both",
      verified: true,
      createdAt: now,
    },

    // ============================================
    // 10. Chat/Messaging (social)
    // ============================================
    {
      id: uuid(),
      name: "Chat/Messaging",
      slug: "chat-messaging",
      category: "social",
      description:
        "Real-time messaging screen with conversation threads, message bubbles, typing indicators, read receipts, and media sharing.",
      layoutPattern: "chat-layout",
      layoutDescription:
        "A header with the recipient's avatar, name, and online status. The main area is a vertically scrolling message list with left-aligned (received) and right-aligned (sent) message bubbles, grouped by date. A pinned input bar at the bottom with a text field, attachment button, and send button. Messages show timestamps and delivery/read status.",
      interactionsJson: JSON.stringify([
        "Type in the message input field to compose a message",
        "Tap send button or press enter to send the message",
        "Tap attachment button to share photos or files",
        "Scroll up to load older messages with pagination",
        "Tap recipient name in header to view their profile",
        "Long press a message for options: copy, reply, delete",
        "Tap an image message to view in full-screen lightbox",
        "Pull down to load older message history",
        "Swipe right on a message to reply inline",
      ]),
      statesJson: JSON.stringify({
        loading:
          "Skeleton message bubbles while conversation history loads",
        populated:
          "Messages displayed in chronological order with date separators between days",
        empty:
          "Empty conversation with a prompt like 'Say hello!' and suggested conversation starters",
        typing:
          "Animated typing indicator (three dots) shown when the other user is composing a message",
        sending:
          "New message bubble appears immediately with a clock icon indicating 'sending', replaced by a checkmark on delivery",
        error:
          "Failed message shown with a red exclamation mark and 'Tap to retry' label",
      }),
      requiredTechCategoriesJson: JSON.stringify([
        "database",
        "auth",
        "realtime",
      ]),
      optionalTechCategoriesJson: JSON.stringify([
        "storage",
        "push-notifications",
      ]),
      stateApproach: "hybrid",
      dataFlowDescription:
        "Reads conversation history from the database on mount with cursor-based pagination (newest at bottom, load older on scroll up). Subscribes to a real-time channel for this conversation to receive new messages, typing indicators, and read receipts. Sent messages are written optimistically to local state and inserted into the database via server action. Media messages upload the attachment to cloud storage first, then send the message with the media URL. Typing status is broadcast to the real-time channel on input change with debounce. Read receipts are sent when messages scroll into the viewport.",
      navigatesToJson: JSON.stringify(["profile", "detail-view"]),
      navigatesFromJson: JSON.stringify([
        "home-dashboard",
        "notification-center",
        "profile",
      ]),
      promptFragment:
        "Build a chat/messaging screen with a real-time message interface. The header shows the conversation partner's avatar, name, and online/offline status dot. The message area displays bubbles aligned left (received, light background) and right (sent, primary color background) with timestamps on each bubble and date separator labels between days. Pin an input bar to the bottom with a text field that grows with content (up to 4 lines), an attachment button on the left, and a send button on the right that activates only when input is non-empty. Implement real-time messaging by subscribing to a channel for this conversation. Sent messages appear instantly (optimistic) with a clock icon that changes to a single checkmark on delivery and double checkmark on read. Show a typing indicator (animated dots in a small bubble) when the other user is composing. Load older messages on scroll-up with a spinner at the top. Support image messages displayed as rounded thumbnails within bubbles, tappable to view full-screen. Long press on a message to show a context menu with Copy, Reply, and Delete options. Handle empty conversations with a friendly prompt and quick-reply suggestion buttons.",
      platforms: "both",
      verified: true,
      createdAt: now,
    },

    // ============================================
    // 11. AI Chat Interface (content)
    // ============================================
    {
      id: uuid(),
      name: "AI Chat Interface",
      slug: "ai-chat-interface",
      category: "content",
      description:
        "AI-powered conversational interface with streaming responses, suggested prompts, markdown rendering, and code syntax highlighting.",
      layoutPattern: "chat-layout",
      layoutDescription:
        "A header with a model selector dropdown and a 'New Chat' button. The main area is a vertically scrolling message list with user messages right-aligned and AI responses left-aligned, each with distinct avatar indicators. AI response bubbles render markdown content including code blocks with syntax highlighting. A suggested prompts area with horizontally scrollable chips appears above the input bar when the conversation is empty or after a completed response. The input bar at the bottom has a multiline text field and a send button.",
      interactionsJson: JSON.stringify([
        "Type a message in the input field and tap send or press Enter to submit",
        "Press Shift+Enter to insert a newline without sending",
        "Tap a suggested prompt chip to auto-fill and send that prompt",
        "Tap the regenerate button below an AI response to get a new response",
        "Tap the copy button on a code block to copy its contents to clipboard",
        "Tap 'Copy' on an entire AI response to copy the full text",
        "Tap 'New Chat' to clear the conversation and start fresh",
        "Tap the model selector to switch between available AI models",
        "Scroll up to view conversation history with older messages loading on demand",
        "Tap 'Scroll to bottom' floating button when scrolled up during a streaming response",
        "Tap 'Edit' on a previous user message to modify and resubmit it",
        "Tap 'Stop' button to cancel a streaming response in progress",
      ]),
      statesJson: JSON.stringify({
        empty:
          "Welcome screen with app logo, a greeting message, and a grid of suggested prompt chips to start a conversation",
        streaming:
          "AI response bubble growing in real-time with an animated cursor or blinking dot at the end of the text as tokens arrive",
        complete:
          "Full AI response rendered with formatted markdown, syntax-highlighted code blocks, and action buttons (copy, regenerate) visible below the response",
        error:
          "Error message in place of AI response with a 'Retry' button to resend the last user message",
        "loading-history":
          "Skeleton message bubbles displayed while previous conversation history loads from the server",
      }),
      requiredTechCategoriesJson: JSON.stringify(["ai", "auth"]),
      optionalTechCategoriesJson: JSON.stringify([
        "database",
        "analytics",
      ]),
      stateApproach: "hybrid",
      dataFlowDescription:
        "Reads conversation history from the database on mount if resuming a saved chat. User messages are appended to local state and sent to the AI backend as a streaming request. The AI response arrives as a server-sent event stream, with tokens appended to the current AI message bubble in real-time. On stream completion, the full conversation turn (user message + AI response) is persisted to the database. The model selector reads available models from configuration. Suggested prompts are loaded from a static list or fetched from the server. Regenerate discards the last AI response and re-sends the user message. Edit re-sends the conversation up to the edited message with the new content.",
      navigatesToJson: JSON.stringify(["settings"]),
      navigatesFromJson: JSON.stringify([
        "home-dashboard",
        "search-browse",
      ]),
      promptFragment:
        "Build an AI chat interface screen with a vertically scrolling message list. Display a header with a model selector dropdown on the left and a 'New Chat' button on the right. User messages appear as right-aligned bubbles with the user's avatar, and AI responses appear as left-aligned bubbles with a distinct AI avatar icon. AI response bubbles must render full markdown including headings, bold, italic, lists, links, and fenced code blocks with syntax highlighting and a 'Copy' button on each code block. During streaming, show an animated blinking cursor at the end of the AI bubble as tokens arrive and auto-scroll the message list to keep the latest content visible. Provide a 'Stop' button in the input area while streaming is in progress. When the conversation is empty, show a welcome state with a greeting, the AI assistant's name, and a grid of 4-6 suggested prompt chips that the user can tap to start a conversation. After each completed AI response, show 'Copy' and 'Regenerate' action buttons below the response bubble. The input bar pins to the bottom with a multiline text field that grows up to 4 lines, supporting Enter to send and Shift+Enter for newline. Show a 'Scroll to bottom' floating button when the user has scrolled up and new content is streaming below. Support editing a previous user message by tapping an edit icon, which resubmits the conversation from that point. Persist conversation turns to the database on completion for history. Handle errors with an inline retry button replacing the failed AI response.",
      platforms: "both",
      verified: true,
      createdAt: now,
    },

    // ============================================
    // 12. Camera/Capture (utility)
    // ============================================
    {
      id: uuid(),
      name: "Camera/Capture",
      slug: "camera-capture",
      category: "utility",
      description:
        "Camera interface for capturing photos or videos with preview, filters, flash controls, and camera switching.",
      layoutPattern: "full-screen-overlay",
      layoutDescription:
        "Full-screen camera viewfinder with a translucent top bar containing flash toggle, camera-switch button, and close/back button. The bottom area has a large circular capture button centered, with the photo library thumbnail on the left and a filter/mode selector on the right. After capture, a preview screen replaces the viewfinder with 'Use Photo' and 'Retake' buttons.",
      interactionsJson: JSON.stringify([
        "Tap the large capture button to take a photo",
        "Long press the capture button to record video (if supported)",
        "Tap camera-switch button to toggle front/rear camera",
        "Tap flash button to cycle through flash modes: auto, on, off",
        "Pinch to zoom in/out on the viewfinder",
        "Tap on the viewfinder to set focus point",
        "Tap photo library thumbnail to select from existing photos",
        "Tap 'Use Photo' to confirm and proceed with the captured image",
        "Tap 'Retake' to dismiss preview and return to viewfinder",
        "Swipe between filter options to preview live effects",
      ]),
      statesJson: JSON.stringify({
        "permission-required":
          "Explanation screen requesting camera access with a 'Grant Access' button and 'Not Now' option",
        viewfinder:
          "Live camera feed displayed full-screen with capture controls overlaid",
        capturing:
          "Brief flash animation and shutter sound effect on photo capture",
        preview:
          "Static image preview with 'Use Photo' and 'Retake' buttons; optional crop/filter controls",
        recording:
          "Video recording indicator with elapsed time counter and pulsing red dot",
        processing:
          "Loading spinner overlay while applying filters or compressing the captured media",
        error:
          "Error message if camera initialization fails or permission is permanently denied, with a button to open device settings",
      }),
      requiredTechCategoriesJson: JSON.stringify(["storage"]),
      optionalTechCategoriesJson: JSON.stringify(["ai", "analytics"]),
      stateApproach: "local",
      dataFlowDescription:
        "Reads camera permission status on mount. If not granted, shows permission request screen. Once granted, initializes the camera stream. Captured photos are stored temporarily in local memory. On confirmation ('Use Photo'), the image is compressed, uploaded to cloud storage, and the resulting URL is passed back to the calling screen (creation-editor, profile, chat) via callback or navigation params. No database writes happen on this screen directly; the calling screen handles persisting the media reference.",
      navigatesToJson: JSON.stringify(["creation-editor", "chat-messaging"]),
      navigatesFromJson: JSON.stringify([
        "creation-editor",
        "chat-messaging",
        "profile",
      ]),
      promptFragment:
        "Build a camera/capture screen with a full-screen viewfinder layout. Display the live camera feed as the background. Overlay a translucent top bar with a close button (left), flash toggle cycling auto/on/off (center), and front/rear camera switch button (right). At the bottom center, render a large circular capture button with a white ring. On the left of the capture button, show a small rounded thumbnail of the most recent photo from the library (tappable to open the photo picker). On capture, play a brief shutter animation and transition to a preview screen showing the captured image full-screen with 'Retake' (bottom-left) and 'Use Photo' (bottom-right) buttons. Handle camera permissions gracefully: if not granted, show an explanation screen with the benefit of granting access and a button that triggers the system permission dialog. If denied, show a message with a button to open device settings. Support pinch-to-zoom on the viewfinder and tap-to-focus with a brief focus indicator animation. Compress the final image to under 1MB before returning it to the calling screen.",
      platforms: "both",
      verified: true,
      createdAt: now,
    },

    // ============================================
    // 12. Map/Location (utility)
    // ============================================
    {
      id: uuid(),
      name: "Map/Location",
      slug: "map-location",
      category: "utility",
      description:
        "Interactive map interface with location markers, user geolocation, search by location, and detail callouts for selected pins.",
      layoutPattern: "map-with-overlay",
      layoutDescription:
        "Full-screen interactive map as the base layer. A floating search bar at the top for location or place search. Map markers/pins for points of interest. A draggable bottom sheet that expands from a peek state (showing selected location summary) to a half or full state (showing full location details). A 'My Location' button floating in the bottom-right to center on the user's current position.",
      interactionsJson: JSON.stringify([
        "Pan the map by dragging to explore different areas",
        "Pinch to zoom in/out on the map",
        "Tap a map marker to select it and show the bottom sheet summary",
        "Drag the bottom sheet up to see full location details",
        "Tap the search bar to enter a location search query",
        "Tap a search result to navigate the map to that location",
        "Tap 'My Location' button to center map on current GPS position",
        "Tap 'Directions' in the bottom sheet to open native maps app",
        "Tap cluster marker to zoom in and reveal individual markers",
      ]),
      statesJson: JSON.stringify({
        "permission-required":
          "Map visible but centered on a default location with a banner prompting location access",
        loading:
          "Map rendered with placeholder markers while location data loads from the server",
        populated:
          "Map with markers at correct positions, clustered when zoomed out, individual when zoomed in",
        "marker-selected":
          "Bottom sheet in peek state showing selected location's name, image, rating, and distance",
        "detail-expanded":
          "Bottom sheet fully expanded showing complete location info, photos, reviews, and actions",
        "no-results":
          "Map centered on searched area with a message overlay: 'No locations found in this area'",
        error:
          "Map still visible with an error toast: 'Could not load locations. Tap to retry.'",
      }),
      requiredTechCategoriesJson: JSON.stringify(["database"]),
      optionalTechCategoriesJson: JSON.stringify([
        "analytics",
        "auth",
      ]),
      stateApproach: "hybrid",
      dataFlowDescription:
        "Reads location permission status on mount and requests if needed. Fetches the user's current GPS coordinates for the 'My Location' feature. Reads location/place data from the database filtered by the visible map bounding box (re-fetches on significant pan or zoom). Search queries hit a geocoding API or server endpoint and return matching locations. Selecting a marker reads the full location details from the database. No writes happen on this screen unless the user performs an action like 'Save Location', which writes to a favorites table.",
      navigatesToJson: JSON.stringify(["detail-view", "search-browse"]),
      navigatesFromJson: JSON.stringify(["home-dashboard", "search-browse"]),
      promptFragment:
        "Build a map/location screen with a full-screen interactive map as the base. Use a map library appropriate for the platform (Mapbox, Google Maps, or Leaflet for web). Overlay a floating search bar at the top with a subtle shadow, supporting location and place name search with autocomplete suggestions in a dropdown. Render markers on the map for points of interest, using marker clustering when zoomed out to prevent visual clutter. Tapping a marker opens a draggable bottom sheet in a 'peek' state showing the location's name, thumbnail image, star rating, distance from the user, and a short description. Dragging the sheet up reveals full details: photo gallery, complete description, address, hours, reviews, and action buttons (Directions, Save, Share). Add a circular 'My Location' button in the bottom-right that centers the map on the user's GPS position with an animated transition. Handle location permission with a contextual prompt explaining why location access improves the experience. Re-fetch visible markers when the map bounding box changes significantly (debounced). Show a subtle loading indicator during data fetches and handle empty results gracefully.",
      platforms: "both",
      verified: true,
      createdAt: now,
    },

    // ============================================
    // 13. Search & Browse (content)
    // ============================================
    {
      id: uuid(),
      name: "Search & Browse",
      slug: "search-browse",
      category: "content",
      description:
        "Search interface with query input, filter controls, categorized browse sections, search history, and results display with sorting.",
      layoutPattern: "search-with-results",
      layoutDescription:
        "A prominent search bar at the top with a filter/sort button. Below the search bar, when idle, show browse sections: trending topics, category grid, and recent searches. When actively searching, replace browse content with a results list. A filter panel slides in from the right or bottom when activated, with filter controls and an 'Apply' button.",
      interactionsJson: JSON.stringify([
        "Tap search bar to focus and bring up the keyboard with recent searches shown",
        "Type to see real-time search suggestions below the search bar",
        "Tap a suggestion to execute that search",
        "Tap a category card in browse mode to view filtered results",
        "Tap the filter button to open the filter panel",
        "Adjust filter controls (toggles, sliders, pickers) and tap 'Apply'",
        "Tap sort control to change result ordering (relevance, newest, rating)",
        "Scroll through search results with infinite scroll",
        "Tap a result item to navigate to its detail view",
        "Tap 'Clear' to reset search and filters and return to browse mode",
        "Swipe left on a recent search to delete it from history",
      ]),
      statesJson: JSON.stringify({
        browse:
          "Default state showing trending items, category cards, and recent search history",
        "search-active":
          "Keyboard open, recent searches and suggestions displayed below the input",
        "results-loading":
          "Skeleton result cards shown while search query executes on the server",
        "results-populated":
          "Result count displayed with sorted list of matching items and active filter badges",
        "no-results":
          "Friendly message with illustration suggesting broader search terms or different filters",
        "filter-open":
          "Filter panel overlay with category, date range, rating, and other filter controls",
        error:
          "Error message with retry button if search query fails; browse sections may still be visible below",
      }),
      requiredTechCategoriesJson: JSON.stringify(["database"]),
      optionalTechCategoriesJson: JSON.stringify([
        "analytics",
        "auth",
      ]),
      stateApproach: "hybrid",
      dataFlowDescription:
        "Reads trending/popular items and category data on mount for the browse state. Reads recent search history from local storage. Search queries are sent to the server (debounced at 300ms) and results are read from a full-text search index or filtered database query. Filter state is maintained locally and included in search requests. Sort preference is stored locally and applied to queries. Search history is written to local storage on each executed search. Active search query and filters are synced to URL params for shareability. Results use cursor-based pagination for infinite scroll.",
      navigatesToJson: JSON.stringify([
        "detail-view",
        "content-feed",
        "profile",
        "map-location",
      ]),
      navigatesFromJson: JSON.stringify(["home-dashboard", "content-feed"]),
      promptFragment:
        "Build a search and browse screen with a prominent search bar at the top. In the default browse state, show sections for trending/popular items (horizontal scroll row), category cards (2-column grid with icons and labels), and recent search history (vertical list with clock icons and swipe-to-delete). When the user taps the search bar, show recent searches and trending search terms as suggestions. As the user types, display real-time search suggestions with debounced server queries (300ms delay). On search execution, transition to a results view showing the result count, active filter badges, and a sort dropdown (Relevance, Newest, Highest Rated). Results display as cards in a vertical list with infinite scroll. Add a filter button that opens a slide-in panel with filter controls: category multi-select, date range picker, rating minimum slider, and any app-specific filters. Include 'Reset Filters' and 'Apply' buttons. Sync the search query and filters to URL params so results are shareable. Show a clear empty state for no results with suggestions. Store search history in local storage for quick access.",
      platforms: "both",
      verified: true,
      createdAt: now,
    },

    // ============================================
    // 14. Pricing/Paywall (core)
    // ============================================
    {
      id: uuid(),
      name: "Pricing/Paywall",
      slug: "pricing-paywall",
      category: "core",
      description:
        "Subscription pricing screen with tier comparison, feature breakdown, free trial option, and purchase flow integration.",
      layoutPattern: "centered-comparison",
      layoutDescription:
        "A headline section with a compelling value proposition. Below, 2-3 pricing tier cards displayed side by side (desktop) or as a horizontally swipeable carousel (mobile), with the recommended tier visually highlighted. Each card shows the plan name, price, billing period, feature list with checkmarks, and a CTA button. Below the cards, a feature comparison table and FAQ section. A 'Restore Purchases' link at the bottom.",
      interactionsJson: JSON.stringify([
        "Swipe horizontally between pricing tier cards on mobile",
        "Tap a pricing card or its CTA button to select that tier",
        "Tap 'Start Free Trial' to begin a trial period for the selected plan",
        "Tap 'Subscribe' to initiate the purchase flow via payment provider",
        "Toggle between monthly and annual billing to see price differences",
        "Tap a feature row in the comparison table to see a tooltip explanation",
        "Tap 'Restore Purchases' to recover previous subscriptions",
        "Tap 'X' or back to dismiss the paywall and continue with the free tier",
        "Scroll down to view the full feature comparison and FAQ",
      ]),
      statesJson: JSON.stringify({
        loading:
          "Skeleton placeholders for pricing cards while plan data loads from the payment provider",
        idle:
          "Pricing tiers displayed with current user's plan highlighted and 'Current Plan' badge",
        "plan-selected":
          "Selected plan card visually emphasized with a highlighted border and expanded CTA",
        purchasing:
          "Loading overlay with 'Processing...' text while the payment provider handles the transaction",
        success:
          "Confirmation screen with checkmark animation, welcome message, and 'Get Started' button",
        error:
          "Toast notification for payment failure with suggestion to try again or use a different method",
        "already-subscribed":
          "Current plan shown with 'Manage Subscription' button instead of purchase CTAs",
      }),
      requiredTechCategoriesJson: JSON.stringify([
        "auth",
        "payments",
      ]),
      optionalTechCategoriesJson: JSON.stringify(["analytics"]),
      stateApproach: "server-state",
      dataFlowDescription:
        "Reads pricing plans and feature lists from the payment provider (Stripe Products/Prices) or local config. Reads the current user's subscription status to determine if they are on a free tier, trial, or active subscription. Selecting a plan and tapping subscribe initiates a checkout session with the payment provider (Stripe Checkout or in-app purchase). The payment result is handled via webhook (web) or purchase callback (mobile). On success, the user's subscription tier is updated in the database. Restore purchases queries the payment provider for existing subscriptions linked to the user's account.",
      navigatesToJson: JSON.stringify(["home-dashboard", "settings"]),
      navigatesFromJson: JSON.stringify([
        "home-dashboard",
        "settings",
        "onboarding-flow",
      ]),
      promptFragment:
        "Build a pricing/paywall screen designed to convert free users to paid subscribers. Start with a compelling headline ('Unlock the full experience') and a short value proposition. Display 2-3 pricing tiers as cards: a Free tier with basic features, a Pro tier (recommended, visually highlighted with a 'Most Popular' badge and distinct border), and optionally a Premium tier. Each card shows the plan name, monthly price in large text, annual price with savings percentage, a bulleted feature list with checkmark icons for included features and X icons for excluded ones, and a CTA button ('Get Started' for free, 'Start Free Trial' for Pro, 'Go Premium' for Premium). Add a monthly/annual toggle at the top that animates price changes on the cards. Below the cards, include a detailed feature comparison table with rows for each feature and columns for each tier. Add a small FAQ section with expandable questions. Include a 'Restore Purchases' link for returning subscribers. The recommended tier's CTA button should use the primary brand color while others use outlined style. On CTA tap, initiate the payment flow through Stripe Checkout or the platform's in-app purchase API.",
      platforms: "both",
      verified: true,
      createdAt: now,
    },

    // ============================================
    // 15. Notification Center (utility)
    // ============================================
    {
      id: uuid(),
      name: "Notification Center",
      slug: "notification-center",
      category: "utility",
      description:
        "Notification inbox displaying grouped notifications with read/unread states, action buttons, swipe actions, and bulk management.",
      layoutPattern: "grouped-list",
      layoutDescription:
        "A header with 'Notifications' title and a 'Mark All as Read' button. The main area is a vertically scrolling list of notification items grouped by time period (Today, Yesterday, This Week, Older). Each item shows an icon or avatar, a title, description, timestamp, and an unread indicator dot. Unread items have a slightly different background color. Swipe actions for individual notifications and a filter/tab bar for notification types.",
      interactionsJson: JSON.stringify([
        "Tap a notification to navigate to the related content and mark it as read",
        "Swipe left on a notification to reveal 'Delete' action",
        "Swipe right on a notification to mark it as read/unread",
        "Tap 'Mark All as Read' to clear all unread indicators",
        "Pull down to refresh and check for new notifications",
        "Tap filter tabs to view specific notification types (All, Mentions, Likes, System)",
        "Scroll through notification groups with section headers",
        "Long press a notification for additional options (mute this type, delete)",
        "Tap the settings gear icon to navigate to notification preferences",
      ]),
      statesJson: JSON.stringify({
        loading:
          "Skeleton notification items mimicking the list layout while notifications load",
        populated:
          "Grouped list with unread items highlighted and read items in default styling",
        empty:
          "Illustration with message 'No notifications yet' and a brief explanation of what triggers notifications",
        "all-read":
          "All items in default styling with 'Mark All as Read' button hidden or disabled",
        error:
          "Error message with retry button if notifications fail to load",
        "filter-active":
          "Filtered list showing only the selected notification type with active filter badge",
      }),
      requiredTechCategoriesJson: JSON.stringify(["database", "auth"]),
      optionalTechCategoriesJson: JSON.stringify([
        "push-notifications",
        "realtime",
      ]),
      stateApproach: "server-state",
      dataFlowDescription:
        "Reads notifications for the current user from the database, ordered by creation timestamp descending, with cursor-based pagination. Each notification includes a type, title, body, reference ID (linking to the related content), read/unread status, and creation timestamp. Marking a notification as read writes an update to its read status. 'Mark All as Read' performs a bulk update on all unread notifications for the user. Deleting a notification removes it from the database (or soft-deletes). Filter tabs modify the database query to filter by notification type. Real-time subscription listens for new notifications and prepends them to the list. The unread count badge on the app's tab bar is derived from the count of unread notifications.",
      navigatesToJson: JSON.stringify([
        "detail-view",
        "profile",
        "chat-messaging",
        "settings",
      ]),
      navigatesFromJson: JSON.stringify(["home-dashboard"]),
      promptFragment:
        "Build a notification center screen with a scrollable list of notifications grouped by time period (Today, Yesterday, This Week, Older) with sticky section headers. Each notification item displays a contextual icon or user avatar on the left, a bold title and descriptive body text in the center, and a relative timestamp on the right. Unread notifications have a small colored dot indicator and a slightly tinted background to distinguish them from read items. Implement swipe gestures: swipe left to reveal a red 'Delete' button, swipe right to toggle read/unread status. Add a 'Mark All as Read' button in the header that updates all unread notifications in a single batch operation. Include a filter tab bar below the header with options like All, Mentions, Likes, Comments, and System, filtering the list by notification type. Tapping a notification marks it as read and navigates to the related content (e.g., a comment notification navigates to the post's detail view). Support pull-to-refresh for checking new notifications and infinite scroll for older ones. Show an engaging empty state illustration when there are no notifications. Add a gear icon in the header linking to notification preference settings. Update the tab bar badge count reactively as notifications are read or received.",
      platforms: "both",
      verified: true,
      createdAt: now,
    },

    // ============================================
    // 16. Calendar View (utility)
    // ============================================
    {
      id: uuid(),
      name: "Calendar View",
      slug: "calendar-view",
      category: "utility",
      description:
        "Calendar interface with date navigation, event management, and multiple view modes (month, week, day) for scheduling and planning.",
      layoutPattern: "full-screen-calendar",
      layoutDescription:
        "A header with the current month/year label, left/right navigation arrows, and a view mode toggle (month/week/day). Below, the calendar grid occupies the main area — in month view, a 7-column grid of day cells with event dots; in week view, a horizontal timeline with hourly rows; in day view, a vertical timeline with event blocks. A floating action button for creating new events. Tapping a day or time slot opens an event creation sheet.",
      interactionsJson: JSON.stringify([
        "Tap left/right arrows or swipe horizontally to navigate between months/weeks/days",
        "Tap a date cell to select it and show that day's events below the calendar",
        "Tap the view mode toggle to switch between month, week, and day views",
        "Tap the floating action button to create a new event",
        "Tap an existing event to view or edit its details in a modal",
        "Long press and drag an event to reschedule it to a different time slot",
        "Pinch vertically on week/day view to zoom the time scale",
        "Tap 'Today' button to jump back to the current date",
      ]),
      statesJson: JSON.stringify({
        loading:
          "Skeleton calendar grid with placeholder event dots while events load from the database",
        "month-view":
          "Full month grid with day numbers, event indicator dots, and the selected day highlighted",
        "week-view":
          "7-column hourly grid with event blocks positioned at their scheduled times",
        "day-view":
          "Single-day hourly timeline with detailed event blocks showing title, time, and color category",
        "event-detail":
          "Modal overlay showing full event details with edit and delete options",
        empty:
          "Calendar displayed with no events; a prompt encourages the user to create their first event",
        error:
          "Error toast if events fail to load or save; calendar grid still visible with a retry option",
      }),
      requiredTechCategoriesJson: JSON.stringify(["database", "realtime"]),
      optionalTechCategoriesJson: JSON.stringify([
        "auth",
        "push-notifications",
        "analytics",
      ]),
      stateApproach: "server-state",
      dataFlowDescription:
        "Reads events from the database filtered by the visible date range (current month/week/day). Each event includes a title, start/end timestamps, color category, and optional recurrence rule. Selecting a date re-filters the event list. Creating or editing an event writes to the database and optionally subscribes to real-time updates so shared calendars reflect changes instantly. Drag-to-reschedule updates the event's start and end timestamps. View mode preference is stored locally.",
      navigatesToJson: JSON.stringify([
        "detail-view",
        "creation-editor",
      ]),
      navigatesFromJson: JSON.stringify(["home-dashboard", "notification-center"]),
      promptFragment:
        "Build a calendar view screen with a header showing the current month/year, left and right arrows for navigation, and a segmented control to toggle between month, week, and day views. In month view, render a 7-column grid with day numbers and small colored dots indicating events on each day. Highlight today's date with a circle and the selected date with a filled accent-color circle. Below the grid, show a scrollable list of events for the selected day with time, title, and color-coded category indicator. In week view, display a 7-column hourly grid where events appear as positioned blocks spanning their duration. In day view, show a single-column hourly timeline with detailed event blocks. Add a floating action button to create a new event — tapping it opens a bottom sheet with fields for title, date/time pickers, duration, color category, and optional recurrence. Support drag-and-drop to reschedule events by long-pressing and dragging to a new time slot. Subscribe to real-time updates so changes from shared calendars appear immediately. Load events for the visible date range and paginate as the user navigates. Show skeleton placeholders during loading.",
      platforms: "both",
      verified: true,
      createdAt: now,
    },

    // ============================================
    // 17. Data Table (utility)
    // ============================================
    {
      id: uuid(),
      name: "Data Table",
      slug: "data-table",
      category: "utility",
      description:
        "Sortable, filterable data table with column headers, pagination controls, row selection, and bulk action capabilities.",
      layoutPattern: "table-with-toolbar",
      layoutDescription:
        "A toolbar at the top with a search/filter input, filter dropdowns, and bulk action buttons (visible when rows are selected). The main area is a horizontally scrollable table with sticky column headers showing sort indicators. Each row displays data cells with a leading checkbox for selection. A pagination bar at the bottom shows page number, total items, and next/previous controls.",
      interactionsJson: JSON.stringify([
        "Tap a column header to sort by that column; tap again to toggle ascending/descending",
        "Type in the search input to filter rows by text content across all columns",
        "Tap a filter dropdown to apply column-specific filters",
        "Tap a row checkbox to select it; tap the header checkbox to select all on the current page",
        "Tap a bulk action button (delete, export, archive) to act on all selected rows",
        "Tap pagination next/previous buttons or a page number to navigate between pages",
        "Tap a row to expand or navigate to its detail view",
        "Swipe horizontally to scroll to additional columns on smaller screens",
      ]),
      statesJson: JSON.stringify({
        loading:
          "Skeleton table rows with shimmering placeholders in each column while data loads",
        populated:
          "Table filled with data rows, column headers showing active sort direction",
        empty:
          "Empty table body with illustration and message like 'No records found'",
        filtered:
          "Filtered result set with active filter badges above the table and a 'Clear Filters' button",
        "rows-selected":
          "Selected rows highlighted with checkmarks; bulk action toolbar appears above the table",
        error:
          "Error message in the table body with a retry button",
      }),
      requiredTechCategoriesJson: JSON.stringify(["database"]),
      optionalTechCategoriesJson: JSON.stringify(["auth", "analytics"]),
      stateApproach: "server-state",
      dataFlowDescription:
        "Reads paginated data from the database with server-side sorting, filtering, and search. Sort configuration (column + direction) and active filters are sent as query parameters to the server. Page size is configurable (10, 25, 50 rows). Row selection is maintained in local state. Bulk actions send an array of selected row IDs to the server for batch processing. The total row count is returned for pagination calculations. Search uses a debounced text input that triggers a server-side full-text or LIKE query.",
      navigatesToJson: JSON.stringify(["detail-view", "creation-editor"]),
      navigatesFromJson: JSON.stringify(["home-dashboard", "admin-dashboard"]),
      promptFragment:
        "Build a data table component with a responsive, horizontally scrollable layout. Add a toolbar above the table with a search input (debounced at 300ms), filter dropdowns for key columns, and a row count display. Render the table with sticky column headers that show sort arrows — tap a header to sort ascending, tap again for descending. Each row starts with a checkbox for selection; the header row has a 'select all' checkbox that toggles all visible rows. When rows are selected, show a contextual action bar with bulk operations like 'Delete Selected', 'Export', and 'Archive'. Implement server-side pagination with controls at the bottom: previous/next buttons, page number display, and a page size selector (10/25/50). Each row is tappable to navigate to the record's detail view. Show skeleton loading rows during data fetches. Handle empty states with a friendly message and illustration. Display active filters as dismissible badges above the table. Ensure the table is accessible with proper ARIA roles for table, row, columnheader, and cell.",
      platforms: "both",
      verified: true,
      createdAt: now,
    },

    // ============================================
    // 18. Kanban Board (core)
    // ============================================
    {
      id: uuid(),
      name: "Kanban Board",
      slug: "kanban-board",
      category: "core",
      description:
        "Drag-and-drop kanban board with columns representing workflow stages and cards representing tasks or items.",
      layoutPattern: "horizontal-columns",
      layoutDescription:
        "A header with the board title and an 'Add Column' button. The main area is a horizontally scrollable row of columns, each with a column header (title, card count, color indicator) and a vertically scrollable list of cards beneath it. Each card shows a title, assignee avatar, labels, and a due date. An 'Add Card' button sits at the bottom of each column. Cards are draggable between columns.",
      interactionsJson: JSON.stringify([
        "Long press and drag a card to move it to a different column or reorder within the same column",
        "Tap a card to open a detail modal with full card information and edit options",
        "Tap 'Add Card' at the bottom of a column to create a new card inline",
        "Tap the column header menu to rename, delete, or change the column color",
        "Tap 'Add Column' to append a new workflow stage to the board",
        "Scroll horizontally to view all columns; scroll vertically within a column to see all cards",
        "Drag a column header to reorder columns",
        "Tap label chips on a card to filter the board by that label",
      ]),
      statesJson: JSON.stringify({
        loading:
          "Skeleton columns with placeholder card shapes while board data loads",
        populated:
          "Columns filled with cards showing titles, avatars, labels, and due dates",
        empty:
          "Single default column with a prompt to add the first card and create additional columns",
        dragging:
          "Active card lifted with a shadow, placeholder shown at the original position, valid drop zones highlighted",
        "card-detail":
          "Modal overlay showing full card details: description, checklist, comments, attachments, and activity log",
        "adding-card":
          "Inline text input at the bottom of a column for quick card creation",
        error:
          "Error toast if board data fails to load or a card move fails to save; card reverts to its original column on failure",
      }),
      requiredTechCategoriesJson: JSON.stringify(["database", "realtime"]),
      optionalTechCategoriesJson: JSON.stringify(["auth", "analytics"]),
      stateApproach: "hybrid",
      dataFlowDescription:
        "Reads all columns and their cards from the database on mount, ordered by column position and card position within each column. Each card includes title, description, assignee, labels, due date, and position index. Drag-and-drop updates the card's column ID and position index — writes are sent to the server and broadcast via real-time subscriptions so other users see changes instantly. New cards are inserted with a position index at the end of the column. Column reordering updates all column position indices. Card detail edits write individual fields to the database.",
      navigatesToJson: JSON.stringify(["detail-view", "profile"]),
      navigatesFromJson: JSON.stringify(["home-dashboard"]),
      promptFragment:
        "Build a kanban board screen with horizontally scrollable columns. Each column has a header showing the column title, card count, and a colored left border indicator. Below the header, render a vertically scrollable list of cards. Each card displays the title, assignee avatar (small circle in the corner), colored label chips, and a due date if set. Implement drag-and-drop using a library like @dnd-kit (web) or react-native-draggable-flatlist (mobile) — on long press, lift the card with a shadow effect, show a placeholder at the original position, and highlight valid drop zones. On drop, update the card's column and position in the database and broadcast the change via real-time subscription. Add an 'Add Card' button at the bottom of each column that expands into an inline text input for quick card creation. Tapping a card opens a detail modal with editable fields: title, rich text description, checklist with progress bar, assignee selector, label picker, due date picker, file attachments, and an activity/comment thread. Include an 'Add Column' button at the end of the columns row. Show skeleton columns during initial load. Support real-time sync so multiple users can collaborate on the same board.",
      platforms: "both",
      verified: true,
      createdAt: now,
    },

    // ============================================
    // 19. Admin Dashboard (utility)
    // ============================================
    {
      id: uuid(),
      name: "Admin Dashboard",
      slug: "admin-dashboard",
      category: "utility",
      description:
        "Administrative panel with overview metrics, user management, feature flag controls, and system monitoring for app operators.",
      layoutPattern: "sidebar-with-content",
      layoutDescription:
        "A collapsible sidebar navigation on the left with menu items for Dashboard, Users, Content, Settings, and Analytics. The main content area on the right shows the active section. The dashboard section has a row of metric cards at the top (total users, revenue, active sessions, error rate), followed by charts (line chart for growth, bar chart for usage), and a recent activity table below.",
      interactionsJson: JSON.stringify([
        "Tap sidebar menu items to switch between admin sections",
        "View summary metrics in the top cards with sparkline trend indicators",
        "Toggle feature flags on/off with confirmation dialogs",
        "Search, filter, and paginate through the user management table",
        "Tap a user row to view their profile, activity, and subscription details",
        "Tap 'Export Data' to download CSV/JSON reports for the selected date range",
        "Select a date range filter to adjust all dashboard metrics and charts",
        "Tap chart data points for detailed breakdowns",
      ]),
      statesJson: JSON.stringify({
        loading:
          "Skeleton metric cards, chart placeholders, and table rows while dashboard data loads",
        populated:
          "All metrics, charts, and tables displaying live data with the selected date range",
        "user-detail":
          "User detail panel showing profile info, subscription status, activity log, and admin actions",
        "feature-flags":
          "Grid of feature flag toggles with descriptions, each showing enabled/disabled status",
        error:
          "Error banner with retry option; sections that loaded successfully still display their data",
      }),
      requiredTechCategoriesJson: JSON.stringify(["auth", "database", "analytics"]),
      optionalTechCategoriesJson: JSON.stringify(["realtime"]),
      stateApproach: "server-state",
      dataFlowDescription:
        "Reads aggregated metrics from the database: total users, new signups (with period comparison), revenue totals from the payment provider, active session counts, and error rates from the monitoring service. Chart data is queried as time-series aggregations grouped by day/week/month based on the selected date range. User management reads from the users table with server-side search, sort, and pagination. Feature flag toggles write to a feature_flags table and may trigger cache invalidation. Data export generates a server-side report and returns a downloadable file URL. All reads require admin role verification.",
      navigatesToJson: JSON.stringify(["detail-view", "settings"]),
      navigatesFromJson: JSON.stringify(["home-dashboard"]),
      promptFragment:
        "Build an admin dashboard with a collapsible sidebar navigation and a main content area. The sidebar should list sections: Overview, Users, Content, Feature Flags, and Settings, with icons and labels. The Overview section displays 4 metric cards in a row showing total users, monthly revenue, active sessions, and error rate — each with a large number, trend arrow (up/down with percentage), and a sparkline mini-chart. Below the metrics, render two charts side by side: a line chart showing user growth over time and a bar chart showing feature usage distribution. Use a date range picker in the top-right to filter all dashboard data. Below the charts, display a recent activity table with columns for user, action, timestamp, and status. The Users section shows a searchable, sortable data table of all users with columns for name, email, plan, signup date, and last active. Tapping a user opens a detail panel with their full profile, subscription history, and admin actions (suspend, change plan, impersonate). The Feature Flags section displays a grid of toggles with flag name, description, and enabled/disabled state — toggling shows a confirmation dialog before writing. Require admin role authentication for the entire dashboard. Show skeleton states during loading.",
      platforms: "web",
      verified: true,
      createdAt: now,
    },

    // ============================================
    // 20. Timeline Feed (social)
    // ============================================
    {
      id: uuid(),
      name: "Timeline Feed",
      slug: "timeline-feed",
      category: "social",
      description:
        "Chronological activity feed displaying a stream of events and updates with inline interactions, filtering, and infinite scroll.",
      layoutPattern: "infinite-scroll-list",
      layoutDescription:
        "A top header with the feed title and a filter/type selector (All, Posts, Comments, Milestones). The main area is a vertical timeline with a connecting line running down the left side. Each activity item has a timestamp, icon or avatar indicating the activity type, a content body, and optional inline action buttons (like, comment). Infinite scroll loads older items at the bottom.",
      interactionsJson: JSON.stringify([
        "Scroll vertically to browse activity items with infinite scroll loading",
        "Pull down to refresh and load the newest activity items",
        "Tap a like/react button on an activity item for inline engagement",
        "Tap the comment icon to expand an inline comment input for quick replies",
        "Tap the filter tabs to show only specific activity types",
        "Tap an activity item to navigate to the related content's detail view",
        "Tap a user avatar or name to navigate to their profile",
      ]),
      statesJson: JSON.stringify({
        loading:
          "Skeleton timeline items with shimmering placeholders mimicking the item layout",
        populated:
          "Timeline filled with activity items in reverse chronological order with type icons and timestamps",
        empty:
          "Illustration with message 'No activity yet' and suggestions to start interacting",
        "loading-more":
          "Small spinner at the bottom of the timeline while fetching older items",
        filtered:
          "Filtered timeline showing only the selected activity type with a filter badge",
        "end-of-feed":
          "Subtle message at the bottom: 'You've reached the beginning' when no more items to load",
        error:
          "Error message with retry button if activity items fail to load; cached items still visible if available",
      }),
      requiredTechCategoriesJson: JSON.stringify(["database", "realtime"]),
      optionalTechCategoriesJson: JSON.stringify(["auth", "analytics"]),
      stateApproach: "server-state",
      dataFlowDescription:
        "Reads activity items from the database in reverse chronological order with cursor-based pagination. Each item includes a type (post, comment, like, milestone, system), actor profile data, a content body, a reference ID linking to the source entity, and a timestamp. Filter selection modifies the database query to include only matching types. Real-time subscription listens for new activity items and prepends them to the top of the feed. Inline likes write to the database with optimistic updates. Comments insert a new activity item linked to the parent. Pull-to-refresh fetches items newer than the first visible timestamp.",
      navigatesToJson: JSON.stringify([
        "detail-view",
        "profile",
        "chat-messaging",
      ]),
      navigatesFromJson: JSON.stringify(["home-dashboard"]),
      promptFragment:
        "Build a timeline feed screen with a vertical activity stream. Render a thin connecting line along the left edge of the feed to create a visual timeline effect. Each activity item displays a colored icon or user avatar aligned with the timeline line, followed by the activity content: actor name (tappable to profile), action description, content preview, and a relative timestamp. Different activity types use distinct icons and accent colors — posts use a pencil icon, comments use a speech bubble, likes use a heart, milestones use a flag. Add inline interaction buttons below each item: like/react and quick comment. Implement cursor-based infinite scroll: load 20 items initially, fetch the next page when the user scrolls near the bottom. Add filter tabs at the top (All, Posts, Comments, Milestones) that filter the feed by activity type. Subscribe to real-time updates to prepend new activity items with a subtle slide-in animation. Support pull-to-refresh. Show skeleton timeline items during initial load and a spinner during pagination. Handle the empty state with an illustration and call-to-action.",
      platforms: "both",
      verified: true,
      createdAt: now,
    },

    // ============================================
    // 21. Rating & Review Form (content)
    // ============================================
    {
      id: uuid(),
      name: "Rating & Review Form",
      slug: "rating-review-form",
      category: "content",
      description:
        "Star rating input with text review composition, optional photo upload, and submission for user-generated product or content reviews.",
      layoutPattern: "form-with-preview",
      layoutDescription:
        "A header showing the item being reviewed (title, thumbnail). Below, a prominent row of 5 tappable stars for rating selection. A multiline text area for the review body. An 'Add Photos' section with a button and thumbnail previews of attached photos. A 'Submit Review' button at the bottom. An optional preview of how the review will appear.",
      interactionsJson: JSON.stringify([
        "Tap a star to set the rating (1-5); tapping the same star again deselects it",
        "Tap the text area to compose the review text with a character counter",
        "Tap 'Add Photos' to attach images from the camera or photo library",
        "Tap an attached photo thumbnail to preview or remove it",
        "Tap 'Submit Review' to post the review",
        "Tap 'Edit' on a previously submitted review to modify it",
        "Swipe down or tap outside to dismiss the keyboard",
      ]),
      statesJson: JSON.stringify({
        idle:
          "Empty form with 5 outlined stars, placeholder text in the review field, and disabled submit button",
        "rating-selected":
          "Selected stars filled with color; submit button enabled once a rating is chosen",
        composing:
          "User actively typing the review; character counter updates in real-time",
        uploading:
          "Progress indicator on photo thumbnails while images upload to storage",
        submitting:
          "Full-width loading bar or spinner on the submit button while the review is being saved",
        submitted:
          "Success confirmation with the published review preview and a 'Done' button",
        editing:
          "Form pre-populated with the user's existing review data for editing",
        error:
          "Toast notification if review submission or photo upload fails, with form data preserved for retry",
      }),
      requiredTechCategoriesJson: JSON.stringify(["database", "file-storage"]),
      optionalTechCategoriesJson: JSON.stringify(["auth", "analytics"]),
      stateApproach: "local",
      dataFlowDescription:
        "Reads the item details (title, thumbnail) from the database or navigation params to display what is being reviewed. If the user has already reviewed this item, reads the existing review to pre-populate the form for editing. Star rating and text are maintained in local state. Photo uploads are sent to cloud storage immediately on selection, with URLs collected in local state. On submit, all review data (rating, text, photo URLs, item ID, user ID, timestamp) is written to the database as a single insert or update. The item's average rating may be recalculated via a database trigger or server-side function.",
      navigatesToJson: JSON.stringify(["detail-view"]),
      navigatesFromJson: JSON.stringify(["detail-view", "content-feed"]),
      promptFragment:
        "Build a rating and review form screen. At the top, display the item being reviewed with its thumbnail image and title for context. Below, render 5 large tappable star icons in a horizontal row — tapping a star fills it and all stars to its left with an accent color and a brief scale animation. Below the stars, show a label reflecting the rating ('Excellent', 'Good', 'Average', 'Poor', 'Terrible'). Add a multiline text input with placeholder 'Write your review...' and a character counter in the bottom-right corner (e.g., '0/500'). Include an 'Add Photos' button that opens a bottom sheet with 'Take Photo' and 'Choose from Library' options. Display attached photos as small removable thumbnails in a horizontal scroll row with upload progress indicators. The 'Submit Review' button should remain disabled until at least a star rating is selected. On submit, show a loading state on the button, then transition to a success view showing the published review. Support editing existing reviews by pre-populating the form and changing the button text to 'Update Review'. Upload photos to cloud storage immediately on selection for faster submission. Validate that review text, if provided, meets a minimum length requirement.",
      platforms: "both",
      verified: true,
      createdAt: now,
    },

    // ============================================
    // 22. File Browser (utility)
    // ============================================
    {
      id: uuid(),
      name: "File Browser",
      slug: "file-browser",
      category: "utility",
      description:
        "File and folder navigation interface with upload, download, rename, delete, and preview capabilities for managing stored files.",
      layoutPattern: "list-with-toolbar",
      layoutDescription:
        "A toolbar with breadcrumb navigation showing the current path, view toggle (list/grid), and action buttons (upload, new folder). The main area displays files and folders in either a list view (icon, name, size, modified date) or a grid view (large thumbnails with names). A contextual action menu appears on file selection. A drag-and-drop upload zone overlays the entire area when files are dragged over.",
      interactionsJson: JSON.stringify([
        "Tap a folder to navigate into it and update the breadcrumb path",
        "Tap a file to preview it (images in lightbox, documents in viewer, others show info)",
        "Tap the upload button or drag-and-drop files onto the area to upload",
        "Tap 'New Folder' to create a folder with an inline name input",
        "Long press or right-click a file/folder to show context menu: rename, delete, download, move",
        "Tap the view toggle to switch between list and grid layouts",
        "Tap breadcrumb segments to navigate to parent directories",
        "Select multiple files with checkboxes for bulk download or delete",
      ]),
      statesJson: JSON.stringify({
        loading:
          "Skeleton file rows or grid tiles while the current directory contents load",
        populated:
          "Files and folders displayed with icons, names, sizes, and modification dates",
        empty:
          "Empty folder with illustration and prompts: 'Drop files here' and 'Upload' button",
        uploading:
          "Upload progress bar for each file being uploaded, with cancel option",
        previewing:
          "File preview modal: image lightbox, PDF viewer, or file info card for unsupported types",
        "drag-over":
          "Highlighted drop zone overlay with dashed border and 'Drop files to upload' message",
        "context-menu":
          "Contextual action menu displayed near the selected file with rename, delete, move, and download options",
        error:
          "Error toast for failed uploads, downloads, or directory loads with a retry option",
      }),
      requiredTechCategoriesJson: JSON.stringify(["file-storage", "database"]),
      optionalTechCategoriesJson: JSON.stringify(["auth", "analytics"]),
      stateApproach: "server-state",
      dataFlowDescription:
        "Reads the list of files and folders for the current path from the storage backend (Supabase Storage, S3, etc.) combined with metadata from the database (file records with name, size, MIME type, path, owner, timestamps). Navigating into a folder re-fetches the contents for the new path. File uploads write to the storage backend with progress tracking, then insert a metadata record in the database. Rename and move operations update the storage path and database record. Delete removes the file from storage and its database record. Download generates a signed URL or streams the file content. Preview reads the file URL for rendering in the appropriate viewer.",
      navigatesToJson: JSON.stringify(["detail-view"]),
      navigatesFromJson: JSON.stringify(["home-dashboard", "profile"]),
      promptFragment:
        "Build a file browser screen with a toolbar showing breadcrumb navigation (Home > Documents > Project), a view toggle (list/grid icon buttons), and action buttons for 'Upload' and 'New Folder'. In list view, display each item as a row with a file type icon (folder, image, document, video, generic), name, file size (formatted as KB/MB/GB), and last modified date. In grid view, show large thumbnail previews for images and type icons for other files, with the name below. Implement folder navigation — tapping a folder updates the breadcrumb and loads its contents. Tapping a file opens a preview: images in a full-screen lightbox with zoom, PDFs in a document viewer, and other types show a file info card with download button. Support file upload via a button that opens the file picker, and drag-and-drop with a visual drop zone overlay. Show individual progress bars for uploading files with cancel option. Add context menu on long press (mobile) or right-click (web) with options: Rename, Move, Delete, Download, and Copy Link. Support multi-select with checkboxes for bulk actions. Handle empty folders with a drop zone illustration and upload prompt.",
      platforms: "both",
      verified: true,
      createdAt: now,
    },

    // ============================================
    // 23. Comparison Matrix (content)
    // ============================================
    {
      id: uuid(),
      name: "Comparison Matrix",
      slug: "comparison-matrix",
      category: "content",
      description:
        "Side-by-side feature comparison grid allowing users to compare multiple items across a set of attributes and feature categories.",
      layoutPattern: "sticky-header-grid",
      layoutDescription:
        "A top bar with an 'Add Item' button and item count. Below, a horizontally scrollable comparison grid with a sticky left column for feature/attribute names. Each added item occupies a column with its header (image, name, price) pinned at the top. Feature rows are grouped by category with collapsible section headers. Cells show checkmarks, X marks, or text values for each feature per item. A highlight mode can emphasize differences between items.",
      interactionsJson: JSON.stringify([
        "Tap 'Add to Compare' on an item to add it as a new column in the matrix",
        "Tap the X on an item column header to remove it from comparison",
        "Scroll horizontally to view all compared items when they exceed the screen width",
        "Tap a feature category header to collapse or expand that group of features",
        "Toggle 'Highlight Differences' to visually emphasize cells where items differ",
        "Tap an item's header to navigate to its full detail view",
        "Scroll vertically through all feature categories",
        "Swipe left on an item column to reveal a remove option on mobile",
      ]),
      statesJson: JSON.stringify({
        empty:
          "Prompt to add at least 2 items to compare with suggested popular items",
        "single-item":
          "One item column displayed with a prompt to add a second item for comparison",
        populated:
          "Full comparison grid with 2-4 items and all feature rows visible",
        "highlight-mode":
          "Cells where items differ are highlighted with a colored background; matching cells are dimmed",
        loading:
          "Skeleton grid with placeholder columns and rows while comparison data loads",
        error:
          "Error message with retry button if item data fails to load; successfully loaded items still visible",
      }),
      requiredTechCategoriesJson: JSON.stringify(["database"]),
      optionalTechCategoriesJson: JSON.stringify(["auth", "analytics"]),
      stateApproach: "hybrid",
      dataFlowDescription:
        "Reads feature definitions and categories from the database or a local configuration. When an item is added to comparison, reads its full feature data from the database. The compared items list is maintained in local state (or URL params for shareable comparisons). Feature values for each item are fetched individually and merged into the comparison grid. Highlight mode compares values across columns and marks differing cells. The comparison state (item IDs) can be synced to URL parameters so users can share a comparison link.",
      navigatesToJson: JSON.stringify(["detail-view", "search-browse"]),
      navigatesFromJson: JSON.stringify(["search-browse", "detail-view"]),
      promptFragment:
        "Build a comparison matrix screen for side-by-side item comparison. Display a sticky header row with item cards (thumbnail, name, price/subtitle, and a remove X button) that scroll horizontally with the grid. The left-most column is sticky and shows feature names grouped under collapsible category headers (e.g., 'General', 'Performance', 'Pricing'). Each cell in the grid shows the feature value for that item — use checkmark icons for boolean features, X marks for missing features, and text/numbers for quantitative values. Add an 'Add Item' button that opens a search modal to find and add items (max 4 for mobile, 6 for web). Include a 'Highlight Differences' toggle that, when active, highlights cells with a colored background where values differ across the compared items and dims cells where they match. Sync the compared item IDs to URL parameters so the comparison is shareable via link. Show a friendly empty state prompting users to add at least 2 items, with suggested popular items as quick-add options. Ensure horizontal scrolling is smooth and the sticky columns stay fixed during scroll. Support collapsing feature categories to reduce visual noise.",
      platforms: "both",
      verified: true,
      createdAt: now,
    },

    // ============================================
    // 24. Analytics Dashboard (data-display)
    // ============================================
    {
      id: uuid(),
      name: "Analytics Dashboard",
      slug: "analytics-dashboard",
      category: "data-display",
      description:
        "Dashboard screen with KPI metric cards, charts (line/bar/pie), date range filtering, and a data table or activity feed for monitoring app or business metrics.",
      layoutPattern: "dashboard-grid",
      layoutDescription:
        "Grid layout with metric cards at top (2-4 KPI cards), followed by chart sections (line/bar/pie charts), and a data table or activity feed at the bottom. Optional date range picker in the header. Responsive: cards stack on mobile, grid on desktop.",
      interactionsJson: JSON.stringify([
        "Tap date range picker to filter all charts/metrics",
        "Tap a KPI card to drill into detailed view",
        "Swipe horizontally on charts to pan timeline",
        "Tap chart data point to see tooltip with exact values",
        "Pull to refresh all dashboard data",
        "Tap filter chips to segment data by category",
      ]),
      statesJson: JSON.stringify({
        idle: "Dashboard loaded with current period data, all charts populated",
        loading: "Skeleton placeholders for each card and chart area",
        empty: "Dashboard structure visible but all metrics show zero with 'Start tracking' prompt",
        error: "Error banner at top with retry button, last successful data still visible if cached",
      }),
      requiredTechCategoriesJson: JSON.stringify(["database"]),
      optionalTechCategoriesJson: JSON.stringify(["analytics", "auth"]),
      stateApproach: "server-state",
      dataFlowDescription:
        "Reads aggregated metrics from the database filtered by the selected date range. KPI cards show computed values (totals, averages, percentages) with period-over-period comparison. Charts display time-series data grouped by day/week/month. The data table shows detailed breakdowns or recent activity. All data fetching should use the server state management library with appropriate cache/stale times. Date range changes re-fetch all dashboard data. Pull-to-refresh triggers a full data refetch.",
      navigatesToJson: JSON.stringify(["detail-view", "settings"]),
      navigatesFromJson: JSON.stringify(["home-dashboard"]),
      promptFragment:
        "Build the dashboard screen with a header containing the page title and a date range picker (default: last 30 days). Create a KPI card row using a horizontal ScrollView (mobile) or CSS grid (web) with 2-4 metric cards showing: metric name, current value, percentage change vs previous period, and a spark line. Below the cards, add 1-2 chart sections using the project's charting library (Recharts for web, Victory Native or react-native-chart-kit for mobile). Charts should respect the date range filter. Add a data table or scrollable list at the bottom showing recent activity or detailed breakdowns. All data fetching should use the server state management library (TanStack Query if selected) with appropriate cache/stale times for dashboard data (staleTime: 5 minutes). Implement pull-to-refresh on mobile.",
      platforms: "both",
      verified: true,
      createdAt: now,
    },

    // ============================================
    // 25. Wizard Flow (forms)
    // ============================================
    {
      id: uuid(),
      name: "Wizard Flow",
      slug: "wizard-flow",
      category: "forms",
      description:
        "Multi-step form wizard with progress indicator, step-level validation, back/next navigation, and a final review step before submission.",
      layoutPattern: "stepped-form",
      layoutDescription:
        "Full-screen multi-step form with a progress indicator at the top (step dots or progress bar), content area in the middle for the current step's form fields, and navigation buttons at the bottom (Back / Next / Submit). Optional step title and description below the progress indicator.",
      interactionsJson: JSON.stringify([
        "Tap Next to validate current step and advance",
        "Tap Back to return to previous step without losing data",
        "Tap step indicator to jump to a completed step",
        "Swipe left/right to navigate between steps (mobile)",
        "Tap Submit on final step to complete the wizard",
        "See validation errors inline on current step fields",
      ]),
      statesJson: JSON.stringify({
        idle: "Current step form displayed with any previously entered data restored",
        loading: "Submit button shows spinner during final submission, fields disabled",
        error: "Inline validation errors on current step fields, step indicator shows error state",
        complete: "Success screen with summary of entered data and next action button",
        partial: "Steps before current show completed checkmarks, current step highlighted, future steps dimmed",
      }),
      requiredTechCategoriesJson: JSON.stringify(["database", "auth"]),
      optionalTechCategoriesJson: JSON.stringify(["analytics"]),
      stateApproach: "local",
      dataFlowDescription:
        "Reads nothing on mount unless editing existing data. Each step collects form data locally. Step-level validation runs before advancing. Back navigation preserves entered data. All collected data is submitted in a single batch on the final step. Form state is maintained in component state or a form library. On submission error, the wizard stays on the review step showing the error.",
      navigatesToJson: JSON.stringify(["home-dashboard", "detail-view"]),
      navigatesFromJson: JSON.stringify(["home-dashboard", "settings"]),
      promptFragment:
        "Create a multi-step wizard component that manages step state, form data persistence across steps, and validation. Use a shared form state (React Hook Form with Zod if selected, or local state) that persists across step transitions. The wizard should support: (1) A progress indicator component showing completed/current/future steps, (2) Step-level validation — validate only current step's fields before allowing Next, (3) Back navigation that preserves entered data, (4) A final review step showing all entered data before submission, (5) Animated transitions between steps (fade or slide). Store the wizard's form data in component state (not global state) since it's local to the wizard flow. On final submit, send all collected data to the API. Handle submission errors by staying on the review step and showing the error.",
      platforms: "both",
      verified: true,
      createdAt: now,
    },

    // ============================================
    // 26. Media Player (media)
    // ============================================
    {
      id: uuid(),
      name: "Media Player",
      slug: "media-player",
      category: "media",
      description:
        "Full-screen or near-full-screen media player for audio/video with playback controls, progress seeking, mini-player mode, and playlist navigation.",
      layoutPattern: "full-screen-media",
      layoutDescription:
        "Full-screen or near-full-screen media area (video/audio player) with overlay controls. For video: play/pause button centered, progress bar at bottom, fullscreen toggle. For audio: album art or waveform visualization, playback controls (previous/play-pause/next), progress slider, volume control. Mini-player bar at bottom when navigating away.",
      interactionsJson: JSON.stringify([
        "Tap play/pause to toggle playback",
        "Drag progress slider to seek to position",
        "Tap fullscreen button to enter/exit fullscreen (video)",
        "Swipe down to minimize to mini-player (mobile)",
        "Tap mini-player to return to full player",
        "Double-tap left/right side to skip back/forward 10 seconds (video)",
        "Tap next/previous buttons for playlist navigation",
      ]),
      statesJson: JSON.stringify({
        idle: "Player loaded with media metadata (title, artist/creator, thumbnail), controls visible, not playing",
        playing: "Media actively playing, progress bar advancing, controls auto-hide after 3 seconds (video)",
        paused: "Media paused at current position, controls visible",
        buffering: "Loading spinner overlay on media area, progress bar shows buffered range",
        miniPlayer: "Collapsed bar at bottom showing title, play/pause, progress bar",
        error: "Error message in media area with retry button, media metadata still visible",
      }),
      requiredTechCategoriesJson: JSON.stringify(["database"]),
      optionalTechCategoriesJson: JSON.stringify(["auth", "analytics"]),
      stateApproach: "hybrid",
      dataFlowDescription:
        "Reads media metadata (title, artist, thumbnail, source URL) from the database or navigation params. Playback state (playing, paused, position, duration) is managed locally in a PlayerContext provider. The mini-player persists across screen navigation by living in the root layout outside the navigator. Queue/playlist data is maintained in the player context. Background audio on mobile requires platform-specific configuration. Play position may be persisted to the database for resume functionality.",
      navigatesToJson: JSON.stringify(["detail-view"]),
      navigatesFromJson: JSON.stringify(["content-feed", "search-browse", "home-dashboard"]),
      promptFragment:
        "Build a media player screen with platform-appropriate media components. For video: use expo-av (Expo) or react-player (web) with custom overlay controls. For audio: use expo-av's Audio API (mobile) or HTML5 Audio (web). Create a PlayerContext provider that manages: current track/video, playback state, position, duration, queue/playlist. Implement a progress bar component with seek capability (pan gesture on mobile, click on web). Build a mini-player component that appears at the bottom of the app when the user navigates away from the player — this should float above the tab bar and show: thumbnail, title, play/pause button, and a thin progress bar. The mini-player should persist across screen navigation (place it in the root layout, outside the navigator). For background audio on mobile, configure expo-av with staysActiveInBackground: true. Handle audio focus/interruptions (phone calls, other apps).",
      platforms: "both",
      verified: true,
      createdAt: now,
    },
  ];

  for (const pattern of patterns) {
    await db.insert(screenPatterns).values(pattern).onConflictDoNothing();
  }

  console.log(`[seed] Seeded ${patterns.length} screen patterns`);
}
