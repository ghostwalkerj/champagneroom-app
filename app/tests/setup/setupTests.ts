import '@testing-library/jest-dom/vitest';
import '@testing-library/svelte/vitest';

import * as matchers from '@testing-library/jest-dom/matchers';
import { expect } from 'vitest';

expect.extend(matchers);
