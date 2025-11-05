import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.ksp)
    alias(libs.plugins.hilt.android)
    // secrets gradle plugin
    id("com.google.android.libraries.mapsplatform.secrets-gradle-plugin")
}

android {
    namespace = "com.cpen321.usermanagement"
    compileSdk = 36
    
    // Force OkHttp version resolution to prevent NoClassDefFoundError
    configurations.all {
        resolutionStrategy {
            force("com.squareup.okhttp3:okhttp:5.1.0")
            force("com.squareup.okhttp3:mockwebserver:5.1.0")
            force("com.squareup.okio:okio:3.9.1")
        }
    }

    defaultConfig {
        applicationId = "com.cpen321.usermanagement"
        minSdk = 31
        //noinspection OldTargetApi
        targetSdk = 33
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        
//        buildConfigField("String", "API_KEY", "\"${project.findProperty("API_KEY") ?: ""}\"")
//        buildConfigField("String", "API_BASE_URL", "\"http://206.12.181.242:3000/api/\"")
//        buildConfigField("String", "IMAGE_BASE_URL", "\"http://206.12.181.242:3000\"")
//    buildConfigField("String", "GOOGLE_CLIENT_ID", "\"228280808099-q9229bfrdhgt9rjor3uv66vdaomhup7t.apps.googleusercontent.com\"")
//    buildConfigField("String", "GOOGLE_WEB_CLIENT_ID", "\"228280808099-9v5feggkb4sag0ij88mk3o4j39j22bv8.apps.googleusercontent.com\"")

        buildConfigField("String", "API_KEY", "\"${project.findProperty("API_KEY") ?: ""}\"")
        buildConfigField("String", "API_BASE_URL", "\"http://20.9.137.129:3000/api/\"")
        buildConfigField("String", "IMAGE_BASE_URL", "\"http://20.9.137.129:3000\"")
        buildConfigField("String", "GOOGLE_CLIENT_ID", "\"228280808099-q9229bfrdhgt9rjor3uv66vdaomhup7t.apps.googleusercontent.com\"")
        buildConfigField("String", "GOOGLE_WEB_CLIENT_ID", "\"228280808099-9v5feggkb4sag0ij88mk3o4j39j22bv8.apps.googleusercontent.com\"")
        buildConfigField("boolean", "AUTH_BYPASS_ENABLED", "false")
        
        // Test configuration
        buildConfigField("String", "STAGING_BASE_URL", "\"http://10.0.2.2:3000/api/\"")
        buildConfigField("String", "TEST_USER_EMAIL", "\"test@example.com\"")
        buildConfigField("String", "TEST_USER_PASSWORD", "\"testpassword\"")
    }

    buildTypes {
        debug {
            // Enable auth bypass for debug builds (used by tests)
            buildConfigField("boolean", "AUTH_BYPASS_ENABLED", "true")
        }
        
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("debug")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    kotlin {
        compilerOptions {
            jvmTarget.set(JvmTarget.JVM_11)
        }
    }
    buildFeatures {
        compose = true
        buildConfig = true // need to build the app (no just sync)
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)
    implementation("androidx.compose.runtime:runtime-livedata:1.5.4")
    
    // Material Icons Extended - includes ALL Material Icons
    implementation("androidx.compose.material:material-icons-extended:1.5.4")

    //userlocation

    implementation("com.google.android.libraries.places:places:3.5.0")
    implementation("com.google.android.gms:play-services-location:21.3.0")
    implementation("com.google.maps.android:maps-compose:4.3.3")
    implementation("io.coil-kt:coil-compose:2.4.0")


    // Navigation
    implementation(libs.androidx.navigation.compose)

    //socket
    implementation("io.socket:socket.io-client:2.1.0") {
        exclude (group = "org.json", module = "json")
    }
    
    // ViewModel
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    
    // Hilt Dependency Injection
    implementation(libs.hilt.android)
    ksp(libs.hilt.android.compiler)
    implementation(libs.hilt.navigation.compose)
    
    // Google Sign-In
    implementation(libs.play.services.auth)
    
    // HTTP client
    implementation(libs.retrofit)
    implementation(libs.converter.gson)
    implementation(libs.logging.interceptor)
    
    // Image loading
    implementation(libs.coil.compose)
    
    // Camera and Image handling
    implementation(libs.androidx.activity.ktx)
    implementation(libs.androidx.activity.compose)
    
    // Coroutines
    implementation(libs.kotlinx.coroutines.android)
    
    // Shared Preferences
    implementation(libs.androidx.datastore.preferences)

    // Material Design Components
    implementation(libs.material)

    implementation(libs.kotlinx.coroutines.play.services)

    implementation(libs.androidx.credentials)
    implementation(libs.androidx.credentials.play.services.auth)
    implementation(libs.googleid)

    testImplementation(libs.junit)
    
    // Android Test Dependencies
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.compose.ui.test.junit4)
    androidTestImplementation("androidx.compose.ui:ui-test-manifest")
    
    // UI Automator for cross-app/system UI testing
    androidTestImplementation("androidx.test.uiautomator:uiautomator:2.3.0")
    
    // MockWebServer for mocking HTTP responses
    // CRITICAL: Must match app's OkHttp version (5.1.0) to prevent NoClassDefFoundError
    // The app uses logging-interceptor:5.1.0 which requires OkHttp 5.1.0
    // Explicitly set versions to match app dependencies
    androidTestImplementation("com.squareup.okhttp3:okhttp:5.1.0")
    androidTestImplementation("com.squareup.okhttp3:mockwebserver:5.1.0")
    // OkIO version compatible with OkHttp 5.1.0
    androidTestImplementation("com.squareup.okio:okio:3.9.1")
    
    // Additional test utilities
    // Note: runner and rules are typically included with androidx.test.ext:junit
    androidTestImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.10.2")
    
    // Hilt testing support for MockWebServer injection
    androidTestImplementation("com.google.dagger:hilt-android-testing:${libs.versions.hilt.get()}")
    kspAndroidTest(libs.hilt.android.compiler)
    
    debugImplementation(libs.androidx.compose.ui.tooling)
    debugImplementation(libs.androidx.compose.ui.test.manifest)
}
