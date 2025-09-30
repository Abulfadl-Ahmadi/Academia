from rest_framework import viewsets, permissions, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from .models import Post, Tag, Category, Comment
from .serializers import (
	PostListSerializer, PostDetailSerializer, PostWriteSerializer,
	TagSerializer, CategorySerializer, CommentSerializer
)


class IsAdminOrTeacher(permissions.BasePermission):
	def has_permission(self, request, view):
		u = request.user
		if not u or not u.is_authenticated:
			# Read-only for anonymous users
			return view.action in ["list", "retrieve"]
		if getattr(u, "role", None) == "teacher" or u.is_staff or u.is_superuser:
			return True
		# Authenticated non-teacher can read only
		return view.action in ["list", "retrieve"]

	def has_object_permission(self, request, view, obj):
		if request.method in permissions.SAFE_METHODS:
			return True
		# Allow author or staff
		return (getattr(request.user, "role", None) == "teacher" and obj.author_id == request.user.id) or request.user.is_staff or request.user.is_superuser


class PostViewSet(viewsets.ModelViewSet):
	queryset = Post.objects.select_related("author").prefetch_related("tags", "categories")
	permission_classes = [IsAdminOrTeacher]
	lookup_field = "slug"
	filter_backends = [filters.SearchFilter, filters.OrderingFilter]
	search_fields = ["title", "excerpt", "content", "tags__name", "categories__title"]
	ordering_fields = ["published_at", "created_at"]
	ordering = ["-published_at", "-created_at"]

	def get_serializer_class(self):
		if self.action in ["create", "update", "partial_update"]:
			return PostWriteSerializer
		if self.action == "retrieve":
			return PostDetailSerializer
		return PostListSerializer

	def get_queryset(self):
		qs = super().get_queryset()
		# Only published for anonymous users
		if not self.request.user.is_authenticated:
			return qs.filter(status=Post.Status.PUBLISHED)
		# Teachers see their posts; staff see all; others only published
		u = self.request.user
		if getattr(u, "role", None) == "teacher" and not u.is_staff:
			return qs.filter(Q(author=u) | Q(status=Post.Status.PUBLISHED)).distinct()
		if not u.is_staff and not u.is_superuser:
			return qs.filter(status=Post.Status.PUBLISHED)
		return qs

	@action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
	def publish(self, request, slug=None):
		post = self.get_object()
		if not (request.user.is_staff or request.user == post.author or getattr(request.user, "role", None) == "teacher"):
			return Response({"detail": "Permission denied"}, status=403)
		post.status = Post.Status.PUBLISHED
		post.save()
		return Response({"status": "published"})


class TagViewSet(viewsets.ModelViewSet):
	queryset = Tag.objects.all()
	serializer_class = TagSerializer
	permission_classes = [IsAdminOrTeacher]
	lookup_field = "slug"
	filter_backends = [filters.SearchFilter]
	search_fields = ["name"]


class CategoryViewSet(viewsets.ModelViewSet):
	queryset = Category.objects.select_related("parent").all()
	serializer_class = CategorySerializer
	permission_classes = [IsAdminOrTeacher]
	lookup_field = "slug"
	filter_backends = [filters.SearchFilter]
	search_fields = ["title", "description"]


class CommentViewSet(viewsets.ModelViewSet):
	queryset = Comment.objects.select_related("post", "user").all()
	serializer_class = CommentSerializer
	permission_classes = [permissions.IsAuthenticatedOrReadOnly]
	filter_backends = [filters.OrderingFilter]
	ordering = ["-created_at"]

	def get_queryset(self):
		qs = super().get_queryset()
		post_slug = self.request.query_params.get("post")
		if post_slug:
			qs = qs.filter(post__slug=post_slug, is_approved=True)
		else:
			qs = qs.filter(is_approved=True)
		return qs

	def perform_create(self, serializer):
		serializer.save(user=self.request.user)

