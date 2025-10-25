# Frontend Components

Shared component library for the Academia platform frontend, providing reusable UI components, layout components, and form components.

## 🏗️ Component Architecture

The components directory contains a well-organized collection of reusable components following modern React patterns and best practices.

```
src/components/
├── README.md (this file)
├── ui/ (UI components)
├── layout/ (Layout components)
├── forms/ (Form components)
└── shared/ (Shared components)
```

## 🎨 UI Components

### Button Component

**Location**: `ui/Button.tsx`

**Features**:
- Multiple variants (primary, secondary, danger)
- Size options (sm, md, lg)
- Loading states
- Disabled states
- Icon support

**Usage**:
```typescript
import { Button } from '@/components/ui/Button';

<Button
  variant="primary"
  size="md"
  loading={isLoading}
  onClick={handleClick}
>
  Click me
</Button>
```

### Input Component

**Location**: `ui/Input.tsx`

**Features**:
- Type validation
- Error states
- Label support
- Placeholder text
- Icon integration

**Usage**:
```typescript
import { Input } from '@/components/ui/Input';

<Input
  type="email"
  label="Email Address"
  placeholder="Enter your email"
  error={errors.email}
  value={email}
  onChange={setEmail}
/>
```

### Modal Component

**Location**: `ui/Modal.tsx`

**Features**:
- Backdrop overlay
- Keyboard navigation
- Focus management
- Size variants
- Animation support

**Usage**:
```typescript
import { Modal } from '@/components/ui/Modal';

<Modal
  isOpen={isModalOpen}
  onClose={handleClose}
  title="Confirm Action"
  size="md"
>
  <p>Are you sure you want to proceed?</p>
</Modal>
```

### Toast Component

**Location**: `ui/Toast.tsx`

**Features**:
- Multiple types (success, error, warning, info)
- Auto-dismiss
- Manual dismiss
- Stack management
- Animation effects

**Usage**:
```typescript
import { useToast } from '@/components/ui/Toast';

const { showToast } = useToast();

showToast({
  type: 'success',
  message: 'Operation completed successfully',
  duration: 3000
});
```

## 📐 Layout Components

### Navbar Component

**Location**: `layout/Navbar.tsx`

**Features**:
- Responsive design
- User menu
- Navigation links
- Search functionality
- Theme toggle

**Usage**:
```typescript
import { Navbar } from '@/components/layout/Navbar';

<Navbar
  user={user}
  onLogout={handleLogout}
  onSearch={handleSearch}
/>
```

### Sidebar Component

**Location**: `layout/Sidebar.tsx`

**Features**:
- Collapsible design
- Navigation groups
- Active state management
- User profile section
- Responsive behavior

**Usage**:
```typescript
import { Sidebar } from '@/components/layout/Sidebar';

<Sidebar
  isOpen={isSidebarOpen}
  onToggle={handleToggle}
  navigation={navigationItems}
/>
```

### Footer Component

**Location**: `layout/Footer.tsx`

**Features**:
- Link sections
- Social media links
- Copyright information
- Contact details
- Newsletter signup

**Usage**:
```typescript
import { Footer } from '@/components/layout/Footer';

<Footer
  links={footerLinks}
  socialMedia={socialLinks}
  copyright="© 2024 Academia Platform"
/>
```

### PageLayout Component

**Location**: `layout/PageLayout.tsx`

**Features**:
- Consistent page structure
- Header and footer integration
- Content area management
- Responsive design
- Loading states

**Usage**:
```typescript
import { PageLayout } from '@/components/layout/PageLayout';

<PageLayout
  title="Dashboard"
  breadcrumbs={breadcrumbs}
  loading={isLoading}
>
  <DashboardContent />
</PageLayout>
```

## 📝 Form Components

### Form Component

**Location**: `forms/Form.tsx`

**Features**:
- Validation integration
- Error handling
- Loading states
- Submit handling
- Field management

**Usage**:
```typescript
import { Form } from '@/components/forms/Form';

<Form
  onSubmit={handleSubmit}
  validation={validationSchema}
  loading={isSubmitting}
>
  <FormField name="email" component={Input} />
  <FormField name="password" component={PasswordInput} />
  <Button type="submit">Submit</Button>
</Form>
```

### FormField Component

**Location**: `forms/FormField.tsx`

**Features**:
- Field validation
- Error display
- Label management
- Required indicators
- Help text support

**Usage**:
```typescript
import { FormField } from '@/components/forms/FormField';

<FormField
  name="email"
  label="Email Address"
  required
  error={errors.email}
  helpText="We'll never share your email"
>
  <Input type="email" />
</FormField>
```

### Select Component

**Location**: `forms/Select.tsx`

**Features**:
- Search functionality
- Multi-select support
- Custom options
- Loading states
- Error handling

**Usage**:
```typescript
import { Select } from '@/components/forms/Select';

<Select
  options={categoryOptions}
  value={selectedCategory}
  onChange={setSelectedCategory}
  placeholder="Select a category"
  searchable
/>
```

## 🔧 Shared Components

### LoadingSpinner Component

**Location**: `shared/LoadingSpinner.tsx`

**Features**:
- Size variants
- Color customization
- Text support
- Overlay mode
- Animation options

**Usage**:
```typescript
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

<LoadingSpinner
  size="lg"
  text="Loading content..."
  overlay
/>
```

### ErrorBoundary Component

**Location**: `shared/ErrorBoundary.tsx`

**Features**:
- Error catching
- Fallback UI
- Error reporting
- Recovery options
- User-friendly messages

**Usage**:
```typescript
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

<ErrorBoundary
  fallback={<ErrorFallback />}
  onError={handleError}
>
  <RiskyComponent />
</ErrorBoundary>
```

### DataTable Component

**Location**: `shared/DataTable.tsx`

**Features**:
- Sortable columns
- Filtering
- Pagination
- Row selection
- Custom cell renderers

**Usage**:
```typescript
import { DataTable } from '@/components/shared/DataTable';

<DataTable
  data={testData}
  columns={columns}
  onSort={handleSort}
  onFilter={handleFilter}
  pagination
/>
```

## 🎯 Component Development

### Creating New Components

**Component Template**:
```typescript
// components/ui/NewComponent.tsx
import React from 'react';
import { cn } from '@/utils/cn';

interface NewComponentProps {
  variant?: 'default' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}

export const NewComponent: React.FC<NewComponentProps> = ({
  variant = 'default',
  size = 'md',
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'base-styles',
        {
          'variant-default': variant === 'default',
          'variant-secondary': variant === 'secondary',
          'size-sm': size === 'sm',
          'size-md': size === 'md',
          'size-lg': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
```

### Component Testing

**Test Template**:
```typescript
// __tests__/components/NewComponent.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { NewComponent } from '@/components/ui/NewComponent';

describe('NewComponent', () => {
  it('renders with default props', () => {
    render(<NewComponent>Test content</NewComponent>);
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });
  
  it('applies variant classes correctly', () => {
    render(
      <NewComponent variant="secondary">Test content</NewComponent>
    );
    expect(screen.getByText('Test content')).toHaveClass('variant-secondary');
  });
  
  it('handles click events', () => {
    const handleClick = jest.fn();
    render(
      <NewComponent onClick={handleClick}>Test content</NewComponent>
    );
    
    fireEvent.click(screen.getByText('Test content'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Component Documentation

**Storybook Stories**:
```typescript
// stories/NewComponent.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { NewComponent } from '@/components/ui/NewComponent';

const meta: Meta<typeof NewComponent> = {
  title: 'UI/NewComponent',
  component: NewComponent,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'secondary'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Default component',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary component',
  },
};
```

## 🎨 Styling Guidelines

### Tailwind CSS Integration

**Component Styling**:
```typescript
// Use Tailwind classes with cn utility
const buttonStyles = cn(
  'inline-flex items-center justify-center rounded-md text-sm font-medium',
  'transition-colors focus-visible:outline-none focus-visible:ring-2',
  'disabled:pointer-events-none disabled:opacity-50',
  {
    'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'default',
    'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
    'h-9 px-3': size === 'sm',
    'h-10 px-4 py-2': size === 'md',
    'h-11 px-8': size === 'lg',
  }
);
```

### CSS Variables

**Theme Integration**:
```css
/* Use CSS variables for theming */
.component {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  border: 1px solid hsl(var(--border));
}
```

## 🔧 Component Utilities

### Class Name Utility

**cn Function**:
```typescript
// utils/cn.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Component Props

**Base Props Interface**:
```typescript
// types/component.ts
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  'data-testid'?: string;
}

export interface VariantProps {
  variant?: 'default' | 'secondary' | 'destructive';
}

export interface SizeProps {
  size?: 'sm' | 'md' | 'lg';
}
```

## 📊 Component Analytics

### Usage Tracking

**Component Analytics**:
```typescript
// Track component usage
export const useComponentAnalytics = (componentName: string) => {
  const trackUsage = useCallback((action: string, data?: any) => {
    analytics.track(`${componentName}:${action}`, data);
  }, [componentName]);
  
  return { trackUsage };
};
```

### Performance Monitoring

**Component Performance**:
```typescript
// Monitor component performance
export const useComponentPerformance = (componentName: string) => {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (duration > 100) { // Log slow renders
        console.warn(`${componentName} render took ${duration}ms`);
      }
    };
  }, [componentName]);
};
```

## 📚 Related Documentation

- [Frontend Architecture](../README.md)
- [Feature Modules](../features/README.md)
- [Context Management](../context/README.md)
- [Styling Guide](../styles/README.md)

---

**Frontend Components** - Reusable component library for educational platform
