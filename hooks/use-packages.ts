export {
  useAvailablePackages,
  useManagedPackages,
  usePackageProductLines,
  bookPackage,
  initiatePackagePayment,
} from '@/hooks/packages/use-packages';
export type { PackageResponseDto, BookedPackageDto, PackageProductLineDto } from '@/sdk/backend-v2';
