from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline
from .models import Post, Tag, Category, Comment, PostImage


@admin.register(Tag)
class TagAdmin(ModelAdmin):
	list_display = ("name", "slug", "created_at")
	search_fields = ("name", "slug")


@admin.register(Category)
class CategoryAdmin(ModelAdmin):
	list_display = ("title", "slug", "parent")
	search_fields = ("title", "slug")
	list_filter = ("parent",)


class PostImageInline(TabularInline):
	model = PostImage
	extra = 1


@admin.register(Post)
class PostAdmin(ModelAdmin):
	list_display = ("title", "author", "status", "published_at", "created_at")
	list_filter = ("status", "author", "categories", "tags")
	search_fields = ("title", "excerpt", "content", "slug")
	prepopulated_fields = {"slug": ("title",)}
	autocomplete_fields = ("author", "categories", "tags")
	inlines = [PostImageInline]


@admin.register(Comment)
class CommentAdmin(ModelAdmin):
	list_display = ("post", "user", "is_approved", "created_at")
	list_filter = ("is_approved", "created_at")
	search_fields = ("content", "user__username", "post__title")

