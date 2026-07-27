# App Store Deployment Configuration - iOS & Android
# Unified console support for all environments (local, staging, production)

$AppStoreConfig = @{
    iOS = @{
        AppIdentifier = "com.prevleakgroup"
        BundleId = "com.prevleakgroup"
        TeamId = "prevleakgroup"
        AppStoreConnect = "https://appstoreconnect.apple.com"
        Apps = @(
            @{
                Name = "PrevLeak"
                BundleId = "com.prevleak"
                AppStoreUrl = "https://apps.apple.com/app/prevleak"
                TestFlightBuild = "latest"
            },
            @{
                Name = "SafeRide"
                BundleId = "com.saferide"
                AppStoreUrl = "https://apps.apple.com/app/saferide"
                TestFlightBuild = "latest"
            },
            @{
                Name = "PaletteMath"
                BundleId = "com.palettemath"
                AppStoreUrl = "https://apps.apple.com/app/palettemath"
                TestFlightBuild = "latest"
            },
            @{
                Name = "QVedic"
                BundleId = "com.qvedic"
                AppStoreUrl = "https://apps.apple.com/app/qvedic"
                TestFlightBuild = "latest"
            }
        )
    }
    Android = @{
        PackageName = "com.prevleakgroup"
        GooglePlayConsole = "https://play.google.com/console"
        ReleaseTrack = "internal"  # internal → alpha → beta → production
        Apps = @(
            @{
                Name = "PrevLeak"
                PackageId = "com.prevleak"
                PlayStoreUrl = "https://play.google.com/store/apps/details?id=com.prevleak"
                VersionCode = 1
                VersionName = "1.0.0"
                MinSdkVersion = 24
                TargetSdkVersion = 34
            },
            @{
                Name = "SafeRide"
                PackageId = "com.saferide"
                PlayStoreUrl = "https://play.google.com/store/apps/details?id=com.saferide"
                VersionCode = 1
                VersionName = "1.0.0"
                MinSdkVersion = 24
                TargetSdkVersion = 34
            },
            @{
                Name = "PaletteMath"
                PackageId = "com.palettemath"
                PlayStoreUrl = "https://play.google.com/store/apps/details?id=com.palettemath"
                VersionCode = 1
                VersionName = "1.0.0"
                MinSdkVersion = 24
                TargetSdkVersion = 34
            },
            @{
                Name = "QVedic"
                PackageId = "com.qvedic"
                PlayStoreUrl = "https://play.google.com/store/apps/details?id=com.qvedic"
                VersionCode = 1
                VersionName = "1.0.0"
                MinSdkVersion = 24
                TargetSdkVersion = 34
            }
        )
    }
}

# Environment Configuration
$EnvironmentConfig = @{
    Development = @{
        Console = "local"
        Port = 8080
        HTTPS = $false
        AppStoreMode = "internal"  # Internal testing
        FirebaseProject = "saferide-peld8"
    }
    Staging = @{
        Console = "staging"
        Port = 443
        HTTPS = $true
        AppStoreMode = "beta"  # Beta testing
        FirebaseProject = "saferide-peld8"
    }
    Production = @{
        Console = "production"
        Port = 443
        HTTPS = $true
        AppStoreMode = "production"  # Live release
        FirebaseProject = "saferide-peld8"
    }
}

Export-ModuleMember -Variable AppStoreConfig, EnvironmentConfig
