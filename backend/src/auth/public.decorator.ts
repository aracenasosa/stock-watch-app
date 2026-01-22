import { SetMetadata } from '@nestjs/common';

//Public decorator for controllers
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
