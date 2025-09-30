from rest_framework import serializers
from .models import Post, Tag, Category, Comment, PostImage


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name", "slug"]


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "title", "slug", "description", "parent"]


class PostImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostImage
        fields = ["id", "image_url", "alt_text", "order"]


class PostListSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    tags = TagSerializer(many=True, read_only=True)
    categories = CategorySerializer(many=True, read_only=True)

    class Meta:
        model = Post
        fields = [
            "id",
            "title",
            "slug",
            "excerpt",
            "cover_image",
            "author",
            "status",
            "published_at",
            "created_at",
            "tags",
            "categories",
        ]

    def get_author(self, obj):
        return {
            "id": obj.author_id,
            "username": getattr(obj.author, "username", None),
        }


class PostDetailSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    tags = TagSerializer(many=True, read_only=True)
    categories = CategorySerializer(many=True, read_only=True)
    images = PostImageSerializer(many=True, read_only=True)

    class Meta:
        model = Post
        fields = [
            "id",
            "title",
            "slug",
            "excerpt",
            "content",
            "cover_image",
            "author",
            "status",
            "published_at",
            "created_at",
            "updated_at",
            "meta_title",
            "meta_description",
            "tags",
            "categories",
            "images",
        ]

    def get_author(self, obj):
        return {
            "id": obj.author_id,
            "username": getattr(obj.author, "username", None),
        }


class PostWriteSerializer(serializers.ModelSerializer):
    tag_ids = serializers.ListField(child=serializers.IntegerField(), required=False)
    category_ids = serializers.ListField(child=serializers.IntegerField(), required=False)

    class Meta:
        model = Post
        fields = [
            "title",
            "excerpt",
            "content",
            "cover_image",
            "status",
            "meta_title",
            "meta_description",
            "tag_ids",
            "category_ids",
        ]

    def create(self, validated_data):
        tag_ids = validated_data.pop("tag_ids", [])
        category_ids = validated_data.pop("category_ids", [])
        post: Post = Post.objects.create(author=self.context["request"].user, **validated_data)
        if tag_ids:
            post.tags.set(Tag.objects.filter(id__in=tag_ids))
        if category_ids:
            post.categories.set(Category.objects.filter(id__in=category_ids))
        return post

    def update(self, instance: Post, validated_data):
        tag_ids = validated_data.pop("tag_ids", None)
        category_ids = validated_data.pop("category_ids", None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        if tag_ids is not None:
            instance.tags.set(Tag.objects.filter(id__in=tag_ids))
        if category_ids is not None:
            instance.categories.set(Category.objects.filter(id__in=category_ids))
        return instance


class CommentSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "post", "content", "is_approved", "user", "created_at"]
        read_only_fields = ["is_approved"]

    def get_user(self, obj):
        return {"id": obj.user_id, "username": getattr(obj.user, "username", None)}

    def create(self, validated_data):
        request = self.context["request"]
        return Comment.objects.create(user=request.user, **validated_data)
