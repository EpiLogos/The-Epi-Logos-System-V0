/**
 * Typography showcase page for the Epi-Logos System
 * Demonstrates the Ranade and Work Sans font implementation
 */

export default function TypographyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="font-heading text-5xl font-bold">Typography System</h1>
          <p className="font-sans text-xl text-muted-foreground">
            Showcasing Ranade and Work Sans in the Epi-Logos System
          </p>
        </div>

        {/* Ranade Font Showcase */}
        <section className="space-y-6">
          <h2 className="font-heading text-3xl font-bold border-b pb-2">
            Ranade Font Family (Headings)
          </h2>
          
          <div className="space-y-4">
            <div>
              <h1 className="font-heading text-4xl font-bold">
                Heading 1 - The Epi-Logos System
              </h1>
              <p className="font-sans text-sm text-muted-foreground mt-1">
                font-heading text-4xl font-bold
              </p>
            </div>

            <div>
              <h2 className="font-heading text-3xl font-bold">
                Heading 2 - Wisdom Synthesis Platform
              </h2>
              <p className="font-sans text-sm text-muted-foreground mt-1">
                font-heading text-3xl font-bold
              </p>
            </div>

            <div>
              <h3 className="font-heading text-2xl font-semibold">
                Heading 3 - Tri-Laminar Architecture
              </h3>
              <p className="font-sans text-sm text-muted-foreground mt-1">
                font-heading text-2xl font-semibold
              </p>
            </div>

            <div>
              <h4 className="font-heading text-xl font-semibold">
                Heading 4 - Agentic Intelligence Layer
              </h4>
              <p className="font-sans text-sm text-muted-foreground mt-1">
                font-heading text-xl font-semibold
              </p>
            </div>

            <div>
              <h5 className="font-heading text-lg font-medium">
                Heading 5 - Knowledge Graph Integration
              </h5>
              <p className="font-sans text-sm text-muted-foreground mt-1">
                font-heading text-lg font-medium
              </p>
            </div>

            <div>
              <h6 className="font-heading text-base font-medium">
                Heading 6 - Vector Database Optimization
              </h6>
              <p className="font-sans text-sm text-muted-foreground mt-1">
                font-heading text-base font-medium
              </p>
            </div>
          </div>
        </section>

        {/* Work Sans Font Showcase */}
        <section className="space-y-6">
          <h2 className="font-heading text-3xl font-bold border-b pb-2">
            Work Sans Font Family (Body Text)
          </h2>
          
          <div className="space-y-6">
            <div>
              <p className="font-sans text-xl leading-relaxed">
                Large Body Text - The Epi-Logos System represents a revolutionary approach to wisdom synthesis, 
                combining advanced AI capabilities with philosophical depth to create meaningful insights.
              </p>
              <p className="font-sans text-sm text-muted-foreground mt-1">
                font-sans text-xl leading-relaxed
              </p>
            </div>

            <div>
              <p className="font-sans text-base leading-relaxed">
                Regular Body Text - Our tri-laminar architecture seamlessly integrates frontend experience, 
                backend processing, and agentic intelligence to deliver a comprehensive platform for 
                knowledge exploration and wisdom generation.
              </p>
              <p className="font-sans text-sm text-muted-foreground mt-1">
                font-sans text-base leading-relaxed
              </p>
            </div>

            <div>
              <p className="font-sans text-sm leading-relaxed">
                Small Body Text - The system leverages multiple LLM providers including Google Gemini, 
                OpenAI GPT, and Anthropic Claude, along with specialized tools like LangExtract for 
                structured information processing.
              </p>
              <p className="font-sans text-sm text-muted-foreground mt-1">
                font-sans text-sm leading-relaxed
              </p>
            </div>

            <div>
              <p className="font-sans text-xs leading-normal text-muted-foreground">
                Caption Text - Supporting information and metadata display
              </p>
              <p className="font-sans text-sm text-muted-foreground mt-1">
                font-sans text-xs leading-normal text-muted-foreground
              </p>
            </div>
          </div>
        </section>

        {/* Font Weights */}
        <section className="space-y-6">
          <h2 className="font-heading text-3xl font-bold border-b pb-2">
            Font Weights
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-heading text-xl font-semibold">Ranade Weights</h3>
              <div className="space-y-2">
                <p className="font-heading text-lg font-normal">Regular (400)</p>
                <p className="font-heading text-lg font-medium">Medium (500)</p>
                <p className="font-heading text-lg font-semibold">SemiBold (600)</p>
                <p className="font-heading text-lg font-bold">Bold (700)</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-heading text-xl font-semibold">Work Sans Weights</h3>
              <div className="space-y-2">
                <p className="font-sans text-lg font-light">Light (300)</p>
                <p className="font-sans text-lg font-normal">Regular (400)</p>
                <p className="font-sans text-lg font-medium">Medium (500)</p>
                <p className="font-sans text-lg font-semibold">SemiBold (600)</p>
                <p className="font-sans text-lg font-bold">Bold (700)</p>
              </div>
            </div>
          </div>
        </section>

        {/* Usage Examples */}
        <section className="space-y-6">
          <h2 className="font-heading text-3xl font-bold border-b pb-2">
            Usage Examples
          </h2>
          
          <div className="space-y-8">
            <div className="bg-card p-6 rounded-lg border">
              <h3 className="font-heading text-2xl font-bold mb-4">
                Article Layout Example
              </h3>
              <p className="font-sans text-lg text-muted-foreground mb-6">
                Lead paragraph with larger text to introduce the content and provide context.
              </p>
              <p className="font-sans text-base leading-relaxed mb-4">
                This is a regular paragraph demonstrating how Work Sans performs in longer form content. 
                The font maintains excellent readability across different sizes and weights, making it 
                ideal for both interface elements and extended reading experiences.
              </p>
              <blockquote className="font-heading text-lg italic leading-relaxed border-l-4 border-primary pl-4 my-6">
                &quot;The combination of Ranade and Work Sans creates a distinctive yet approachable 
                typographic voice for the Epi-Logos System.&quot;
              </blockquote>
              <p className="font-sans text-sm text-muted-foreground">
                Caption or metadata information using smaller text size.
              </p>
            </div>
          </div>
        </section>

        {/* CSS Classes Reference */}
        <section className="space-y-6">
          <h2 className="font-heading text-3xl font-bold border-b pb-2">
            CSS Classes Reference
          </h2>
          
          <div className="bg-muted p-6 rounded-lg">
            <h3 className="font-heading text-xl font-semibold mb-4">Available Classes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-sm">
              <div>
                <p><code className="bg-background px-2 py-1 rounded">font-heading</code> - Ranade font family</p>
                <p><code className="bg-background px-2 py-1 rounded">font-sans</code> - Work Sans font family</p>
              </div>
              <div>
                <p><code className="bg-background px-2 py-1 rounded">font-normal</code> - 400 weight</p>
                <p><code className="bg-background px-2 py-1 rounded">font-medium</code> - 500 weight</p>
                <p><code className="bg-background px-2 py-1 rounded">font-semibold</code> - 600 weight</p>
                <p><code className="bg-background px-2 py-1 rounded">font-bold</code> - 700 weight</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
