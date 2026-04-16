export {
  useAvailablePackages,
  useManagedPackages,
  usePackageProductLines,
  bookPackage,
  initiatePackagePayment,
} from '@/hooks/packages/use-packages';
export type { BookedPackage, PackageProductLine } from '@/hooks/packages/use-packages';
export type { PackageResponseDto } from '@/sdk/backend-v2';
