// Re-export shim — use hooks/packages/use-packages instead
export {
  useAvailablePackages,
  useManagedPackages,
  usePackageProductLines,
  bookPackage,
  initiatePackagePayment,
} from '@/hooks/packages/use-packages';
export type { AvailablePackage, BookedPackage, PackageProductLine } from '@/hooks/packages/use-packages';
