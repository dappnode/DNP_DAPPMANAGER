#!/bin/bash
# Script to synchronize master branch with develop branch
# This is useful when master has unnecessary merge commits but the same content as develop

set -e

echo "🔍 Checking current status..."

# Fetch latest changes
git fetch origin

# Check if master and develop have the same tree
MASTER_TREE=$(git rev-parse master^{tree})
DEVELOP_TREE=$(git rev-parse develop^{tree})

echo "Master tree:  $MASTER_TREE"
echo "Develop tree: $DEVELOP_TREE"

if [ "$MASTER_TREE" = "$DEVELOP_TREE" ]; then
    echo "✅ Trees are identical - safe to sync"
    
    # Check if there are any file differences
    if git diff --quiet master develop; then
        echo "✅ No file differences between master and develop"
        
        # Show what commits are different
        echo ""
        echo "📊 Commits in master but not in develop:"
        git log --oneline master ^develop || echo "  (none)"
        
        echo ""
        echo "📊 Commits in develop but not in master:"
        git log --oneline develop ^master || echo "  (none)"
        
        echo ""
        echo "To sync master with develop, run:"
        echo "  git checkout master"
        echo "  git reset --hard develop"
        echo "  git push --force-with-lease origin master"
    else
        echo "⚠️  Warning: File differences detected!"
        git diff --stat master develop
        exit 1
    fi
else
    echo "❌ Trees are different - manual review required"
    echo "There are actual content differences between the branches"
    exit 1
fi
