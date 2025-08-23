from django.contrib import admin
from .models import Ticket, TicketResponse, TicketAttachment

class TicketResponseInline(admin.TabularInline):
    model = TicketResponse
    extra = 0
    readonly_fields = ('user', 'created_at')

class TicketAttachmentInline(admin.TabularInline):
    model = TicketAttachment
    extra = 0
    fields = ('file', 'uploaded_at')
    readonly_fields = ('uploaded_at',)

@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'created_by', 'assigned_to', 'status', 'priority', 'category', 'created_at', 'updated_at')
    list_filter = ('status', 'priority', 'category', 'created_at')
    search_fields = ('title', 'description', 'created_by__username', 'assigned_to__username')
    readonly_fields = ('created_at', 'updated_at')
    inlines = [TicketResponseInline, TicketAttachmentInline]
    date_hierarchy = 'created_at'
    list_per_page = 20

@admin.register(TicketResponse)
class TicketResponseAdmin(admin.ModelAdmin):
    list_display = ('id', 'ticket', 'user', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('content', 'user__username', 'ticket__title')
    readonly_fields = ('created_at',)
    date_hierarchy = 'created_at'
    inlines = [TicketAttachmentInline]

@admin.register(TicketAttachment)
class TicketAttachmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_related_item', 'file', 'uploaded_at')
    list_filter = ('uploaded_at',)
    readonly_fields = ('uploaded_at',)
    date_hierarchy = 'uploaded_at'
    
    def get_related_item(self, obj):
        if obj.ticket:
            return f"Ticket: {obj.ticket.title}"
        elif obj.response:
            return f"Response: {obj.response.ticket.title}"
        return "N/A"
    get_related_item.short_description = "Related Item"
