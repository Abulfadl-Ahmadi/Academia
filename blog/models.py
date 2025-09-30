from django.db import models
from django.utils import timezone
from django.utils.text import slugify
from django.conf import settings


class TimeStampedModel(models.Model):
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		abstract = True


class Tag(TimeStampedModel):
	name = models.CharField(max_length=64, unique=True)
	slug = models.SlugField(max_length=80, unique=True, blank=True)

	class Meta:
		ordering = ["name"]

	def __str__(self) -> str:
		return self.name

	def save(self, *args, **kwargs):
		if not self.slug:
			self.slug = slugify(self.name)
		return super().save(*args, **kwargs)


class Category(TimeStampedModel):
	title = models.CharField(max_length=128, unique=True)
	slug = models.SlugField(max_length=140, unique=True, blank=True)
	description = models.TextField(blank=True)
	parent = models.ForeignKey("self", null=True, blank=True, related_name="children", on_delete=models.SET_NULL)

	class Meta:
		ordering = ["title"]
		verbose_name_plural = "Categories"

	def __str__(self) -> str:
		return self.title

	def save(self, *args, **kwargs):
		if not self.slug:
			self.slug = slugify(self.title)
		return super().save(*args, **kwargs)


class Post(TimeStampedModel):
	class Status(models.TextChoices):
		DRAFT = "draft", "Draft"
		PUBLISHED = "published", "Published"

	title = models.CharField(max_length=200)
	slug = models.SlugField(max_length=220, unique=True, blank=True)
	excerpt = models.TextField(blank=True)
	content = models.TextField()
	author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="blog_posts")
	status = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT)
	published_at = models.DateTimeField(null=True, blank=True)
	tags = models.ManyToManyField(Tag, blank=True, related_name="posts")
	categories = models.ManyToManyField(Category, blank=True, related_name="posts")
	cover_image = models.URLField(blank=True, null=True)
	# SEO
	meta_title = models.CharField(max_length=255, blank=True)
	meta_description = models.CharField(max_length=300, blank=True)

	class Meta:
		ordering = ["-published_at", "-created_at"]

	def __str__(self) -> str:
		return self.title

	def save(self, *args, **kwargs):
		if not self.slug:
			base = slugify(self.title)[:50]
			slug = base
			i = 1
			while Post.objects.filter(slug=slug).exclude(pk=self.pk).exists():
				slug = f"{base}-{i}"
				i += 1
			self.slug = slug
		if self.status == Post.Status.PUBLISHED and not self.published_at:
			self.published_at = timezone.now()
		return super().save(*args, **kwargs)


class PostImage(TimeStampedModel):
	post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="images")
	image_url = models.URLField()
	alt_text = models.CharField(max_length=200, blank=True)
	order = models.PositiveIntegerField(default=0)

	class Meta:
		ordering = ["order", "id"]

	def __str__(self) -> str:
		return f"Image for {self.post_id} ({self.order})"


class Comment(TimeStampedModel):
	post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="blog_comments")
	content = models.TextField()
	is_approved = models.BooleanField(default=True)

	class Meta:
		ordering = ["-created_at"]

	def __str__(self) -> str:
		return f"Comment by {self.user} on {self.post}"

