@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #f8f9fa; /* Light Gray Background */
  --foreground: #212529; /* Dark Text */
  --primary: #e53e3e;     /* ilovepdf.com's Red */
  --primary-hover: #c53030; /* Darker Red for Hover */
  --secondary: #495057;  /* Medium Gray for Secondary Text */
  --border: #dee2e6;     /* Light Border Color */
  --card-bg: #ffffff;    /* White Card Background */
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  margin: 0;
  padding: 0;
  line-height: 1.6;
}

* {
  box-sizing: border-box;
}

a {
  color: var(--primary);
  text-decoration: none;
  transition: color 0.2s ease;
}

a:hover {
  color: var(--primary-hover);
  text-decoration: underline;
}

button {
  font-family: inherit;
}

/* Tool Card Styling */
.tool-card {
  background: var(--card-bg);
  border-radius: 12px;
  border: 1px solid var(--border);
  padding: 1.5rem;
  text-align: center;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.tool-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  border-color: var(--primary);
}

/* Processing Animation */
.processing-animation {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 1rem;
}

.processing-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Download Button Styling */
.download-button {
  display: inline-block;
  background-color: var(--primary);
  color: white;
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  text-align: center;
  transition: background-color 0.2s ease;
  border: none;
  cursor: pointer;
}

.download-button:hover {
  background-color: var(--primary-hover);
}

.download-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

/* Ad Placeholder - Clean and Unobtrusive */
.ad-placeholder {
  background: #f1f3f5;
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--secondary);
  font-size: 0.875rem;
  text-align: center;
  border-radius: 8px;
  min-height: 90px;
}
