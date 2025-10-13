#!/bin/bash

# Build Optimization Script for BPL Commander Frontend
# This script optimizes the build process and provides different build modes

echo "🚀 BPL Commander Frontend Build Optimizer"
echo "=========================================="

# Function to clean build artifacts
clean_build() {
    echo "🧹 Cleaning build artifacts..."
    rm -rf build
    rm -rf dist
    rm -rf node_modules/.vite
    echo "✅ Build artifacts cleaned"
}

# Function to check dependencies
check_deps() {
    echo "📦 Checking dependencies..."
    if [ ! -d "node_modules" ]; then
        echo "⚠️  node_modules not found. Installing dependencies..."
        npm install
    else
        echo "✅ Dependencies found"
    fi
}

# Function to run fast build (development mode)
fast_build() {
    echo "⚡ Running fast build (development mode)..."
    npm run build:fast
    echo "✅ Fast build completed"
}

# Function to run production build
prod_build() {
    echo "🏭 Running production build..."
    npm run build
    echo "✅ Production build completed"
}

# Function to analyze bundle
analyze_build() {
    echo "📊 Analyzing bundle size..."
    npm run build:analyze
    echo "✅ Bundle analysis completed"
}

# Function to show build stats
show_stats() {
    if [ -d "build" ]; then
        echo "📈 Build Statistics:"
        echo "==================="
        echo "Total build size: $(du -sh build | cut -f1)"
        echo "JavaScript files: $(find build -name "*.js" -exec du -ch {} + | tail -1 | cut -f1)"
        echo "CSS files: $(find build -name "*.css" -exec du -ch {} + | tail -1 | cut -f1)"
        echo "Asset files: $(find build -name "*.png" -o -name "*.jpg" -o -name "*.svg" | wc -l) files"
    else
        echo "❌ No build directory found"
    fi
}

# Main menu
case "$1" in
    "clean")
        clean_build
        ;;
    "fast")
        check_deps
        fast_build
        show_stats
        ;;
    "prod")
        check_deps
        prod_build
        show_stats
        ;;
    "analyze")
        check_deps
        analyze_build
        ;;
    "stats")
        show_stats
        ;;
    *)
        echo "Usage: $0 {clean|fast|prod|analyze|stats}"
        echo ""
        echo "Commands:"
        echo "  clean   - Clean build artifacts"
        echo "  fast    - Fast build (development mode)"
        echo "  prod    - Production build"
        echo "  analyze - Analyze bundle size"
        echo "  stats   - Show build statistics"
        echo ""
        echo "Examples:"
        echo "  $0 fast    # Quick build for development"
        echo "  $0 prod    # Full production build"
        echo "  $0 analyze # Analyze bundle and show recommendations"
        exit 1
        ;;
esac
