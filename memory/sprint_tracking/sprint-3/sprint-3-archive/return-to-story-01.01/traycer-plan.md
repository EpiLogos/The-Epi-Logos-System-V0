I have created the following plan after thorough exploration and analysis of the codebase. Follow the below plan verbatim. Trust the files and references. Do not re-verify what's written in the plan. Explore only when absolutely necessary. First implement all the proposed file changes and then I'll review all the changes together at the end.

### Observations

I've explored the codebase and found that the Living Placeholder system is already partially implemented but needs refinement before broader deployment. The current placeholder-demo page needs removal and replacement with a proper template accessible via the dev portal. The GraphQL coordinate resolution is working, but the DevModeModal component is missing. The existing subsystem scene pages have foundational animations and serve as good design references, so they should remain untouched while we perfect the placeholder system first.

### Approach

This implementation will follow a focused refinement strategy. First, we'll remove the failed placeholder-demo page and create a proper placeholder template page accessible via the dev portal. We'll build the missing DevModeModal component and establish a centralized color palette system. The focus is on perfecting the placeholder template's thematic and stylistic alignment with cosmic black backgrounds, philosopher white text, and subsystem-specific styling before any broader site deployment. The coordinate display will handle basic info only, while full details will be rendered in the canvas/card/dynamic content areas.

### Reasoning

I explored the story document to understand the requirements, then examined the existing placeholder system components. I found the current placeholder-demo page that needs removal, checked the GraphQL schema and coordinate service, and discovered that DevModeModal was missing. The user clarified that we should focus on refining the placeholder system first rather than immediately replacing the well-designed subsystem scene pages, and that coordinate display should only handle basic info while full details go in the main content areas.

## Mermaid Diagram

sequenceDiagram
    participant Dev as Developer
    participant DevPortal as Dev Portal
    participant PlaceholderTemplate as Placeholder Template
    participant DevModeModal as Dev Mode Modal
    participant GraphQLService as GraphQL Service
    participant ThemeSystem as Theme System

    Dev->>DevPortal: Navigate to /dev/placeholder-template
    DevPortal->>PlaceholderTemplate: Render with test coordinate
    PlaceholderTemplate->>GraphQLService: resolveCoordinate(test)
    GraphQLService-->>PlaceholderTemplate: Return full coordinate data
    PlaceholderTemplate->>ThemeSystem: Apply subsystem-specific styling
    PlaceholderTemplate-->>Dev: Display refined placeholder

    Dev->>PlaceholderTemplate: Press Ctrl+Shift+D
    PlaceholderTemplate->>DevModeModal: Open development controls
    DevModeModal-->>Dev: Show styling/coordinate controls
    
    loop Refinement Process
        Dev->>DevModeModal: Adjust styling/coordinate
        DevModeModal->>PlaceholderTemplate: Update configuration
        PlaceholderTemplate->>ThemeSystem: Apply new styling
        PlaceholderTemplate-->>Dev: Live preview updates
    end
    
    Dev->>DevModeModal: Export refined settings
    DevModeModal-->>Dev: Save configuration for deployment

## Proposed File Changes

### frontend/src/app/placeholder-demo/page.tsx(DELETE)

Remove the failed placeholder demo page entirely as mentioned in the user requirements. This page was described as 'an unfortunate failure' and needs to be completely removed before implementing the proper Living Placeholder system.

### frontend/src/app/dev/placeholder-template/page.tsx(NEW)

References: 

- frontend/src/components/placeholder/PlaceholderPageTemplate.tsx(MODIFY)

Create a new placeholder template page accessible via the dev portal to replace the old placeholder-demo. This page will serve as the testing ground for refining the placeholder system's thematic and stylistic alignment. Import PlaceholderPageTemplate from `frontend/src/components/placeholder/PlaceholderPageTemplate.tsx` and configure it with a test coordinate (e.g., '#2-3') to demonstrate the system. Enable development mode by default and include proper styling to match the cosmic black/philosopher white theme. This allows for iterative refinement before broader deployment.

### frontend/src/theme/subsystemPalette.ts(NEW)

References: 

- frontend/src/components/placeholder/LivingPlaceholder.tsx(MODIFY)

Create a centralized color palette system based on the subsystem themes already defined in `frontend/src/components/placeholder/LivingPlaceholder.tsx`. This will establish the cosmic black backgrounds and philosopher white text styling mentioned in the requirements, with subsystem-specific color palettes for each coordinate branch. Export SUBSYSTEM_THEMES constant with enhanced color definitions including primary, secondary, accent colors and cosmic black/white base colors. Include proper TypeScript interfaces for theme structure and ensure compatibility with existing placeholder components. Focus on sleek, minimalistic, modern styling with thin borders as specified.

### frontend/src/components/dev/DevModeModal.tsx(MODIFY)

References: 

- frontend/src/components/placeholder/PlaceholderPageTemplate.tsx(MODIFY)

Create the missing DevModeModal component that is referenced in `frontend/src/components/placeholder/PlaceholderPageTemplate.tsx`. This modal should provide collapsible development controls for live coordinate switching, styling experimentation, and template variations as specified in the story AC #11. Include TypeScript interfaces for DevModeControls with coordinate selector, template variations (canvas/card/dynamic), styling controls for colors/borders/animations, and preview mode toggle. Implement modal with cosmic black background, thin borders, and philosopher white text to match the design requirements. Ensure it doesn't interfere with page viewing when collapsed and provides real-time styling adjustments for testing the placeholder system.

### frontend/.env(NEW)

References: 

- frontend/src/lib/coordinateService.ts(MODIFY)

Create environment configuration file to support the GraphQL endpoint configuration for production. Add NEXT_PUBLIC_GRAPHQL_ENDPOINT variable pointing to the backend GraphQL service. This supports the coordinate resolution system integration and ensures the Living Placeholder template can properly fetch coordinate data from the backend as specified in AC #2. Include production endpoint configurations and any other environment variables needed for the placeholder system.

### frontend/.env.local(MODIFY)

References: 

- frontend/src/lib/coordinateService.ts(MODIFY)

Create local development environment configuration file to support the GraphQL endpoint configuration. Add NEXT_PUBLIC_GRAPHQL_ENDPOINT variable pointing to the local backend GraphQL service (localhost:8000/graphql). This supports the coordinate resolution system integration for development and ensures the Living Placeholder template can properly fetch coordinate data during local testing. Include development-specific configurations and any debugging flags needed for the placeholder system refinement.

### frontend/src/lib/coordinateService.ts(MODIFY)

References: 

- backend/epi_logos_system/cag/bimba/schema.graphql

Update the GraphQL endpoint configuration to use environment variables instead of hardcoded localhost URL. Replace the hardcoded GRAPHQL_ENDPOINT with process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT with fallback to current localhost for development. Enhance error handling to provide more specific feedback for coordinate resolution failures. Update the CoordinateResolution interface to include additional fields that may be needed by the placeholder system, ensuring compatibility with the BimbaNode schema from `backend/epi_logos_system/cag/bimba/schema.graphql`. Focus on providing the data needed for the canvas/card/dynamic content areas rather than just basic coordinate info.

### frontend/src/components/placeholder/LivingPlaceholder.tsx(MODIFY)

References: 

- frontend/src/theme/subsystemPalette.ts(NEW)

Update the component to import subsystem themes from the new centralized palette file `frontend/src/theme/subsystemPalette.ts` instead of using the local SUBSYSTEM_THEMES constant. Enhance the canvas/card/dynamic content areas to display full coordinate details and subsystem information, rather than relying on the coordinate display component for this. The coordinate display component should only handle basic info as it's embedded in the epii navigation. Focus on making the canvas/card/dynamic objects rich with coordinate-specific content, implementing the cosmic black backgrounds and philosopher white text requirements. Ensure the component properly handles subsystem-specific styling for coordinate branches and provides a polished placeholder experience.

### frontend/src/components/placeholder/PlaceholderPageTemplate.tsx(MODIFY)

References: 

- frontend/src/components/dev/DevModeModal.tsx(MODIFY)
- frontend/src/theme/subsystemPalette.ts(NEW)

Update the component to properly import and use the DevModeModal component from `frontend/src/components/dev/DevModeModal.tsx`. Ensure the template integrates with the centralized color palette system from `frontend/src/theme/subsystemPalette.ts`. Since the coordinate display component is already embedded in the epii navigation and should only handle basic info, focus the template on providing the structure for the main content areas where full coordinate details will be displayed. Enhance the styling to fully implement the sleek, minimalistic, modern design with thin borders, cosmic black backgrounds, and philosopher white text as required. Ensure the development mode provides collapsible controls that don't interfere with page viewing and allow for real-time refinement of the placeholder system.