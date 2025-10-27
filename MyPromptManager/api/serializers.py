from __future__ import annotations

from typing import Any, Dict, Optional

from rest_framework import serializers

from prompts import services
from prompts.models import PromptRecord, PromptTemplateRecord, VersionRecord


class TagSerializer(serializers.Serializer):
    name = serializers.CharField()
    slug = serializers.CharField(read_only=True)
    created_at = serializers.CharField(read_only=True)

    def create(self, validated_data: Dict[str, Any]):
        return services.create_tag(validated_data["name"])


class TagListField(serializers.ListField):
    def to_representation(self, value):
        if isinstance(value, (list, tuple)):
            return list(value)
        return super().to_representation(value)


class PromptVersionSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    prompt = serializers.CharField(write_only=True, required=False)
    version = serializers.IntegerField(read_only=True)
    content = serializers.CharField()
    metadata = serializers.JSONField(required=False)
    changelog = serializers.CharField(required=False, allow_blank=True)
    created_at = serializers.CharField(read_only=True)
    created_by = serializers.CharField(read_only=True, allow_null=True)

    def validate_prompt(self, value):
        try:
            services.get_prompt(value)
        except KeyError as exc:
            raise serializers.ValidationError("Prompt not found.") from exc
        return value

    def create(self, validated_data: Dict[str, Any]):
        prompt_id = validated_data["prompt"]
        content = validated_data["content"]
        metadata = validated_data.get("metadata")
        changelog = validated_data.get("changelog", "")
        user = self.context.get("request").user if self.context.get("request") else None
        return services.create_prompt_version(
            prompt_id=prompt_id,
            content=content,
            metadata=metadata,
            changelog=changelog,
            user=user,
        )

    def to_representation(self, instance: VersionRecord):
        return {
            "id": instance.id,
            "prompt": instance.parent_id,
            "version": instance.version,
            "content": instance.content,
            "metadata": instance.metadata,
            "changelog": instance.changelog,
            "created_at": instance.created_at,
            "created_by": instance.created_by,
        }


class PromptSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    name = serializers.CharField()
    description = serializers.CharField(required=False, allow_blank=True)
    tags = TagListField(
        child=serializers.CharField(), required=False, allow_empty=True
    )
    is_archived = serializers.BooleanField(required=False)
    created_at = serializers.CharField(read_only=True)
    updated_at = serializers.CharField(read_only=True)
    created_by = serializers.CharField(read_only=True, allow_null=True)
    active_version = PromptVersionSerializer(read_only=True)
    latest_version = PromptVersionSerializer(read_only=True)
    content = serializers.CharField(write_only=True, required=False)
    metadata = serializers.JSONField(write_only=True, required=False)
    changelog = serializers.CharField(write_only=True, required=False, allow_blank=True)

    def create(self, validated_data: Dict[str, Any]):
        content = validated_data.pop("content", None)
        if not content:
            raise serializers.ValidationError({"content": "Content is required."})
        metadata = validated_data.pop("metadata", None)
        changelog = validated_data.pop("changelog", "")
        tags = validated_data.pop("tags", [])
        user = self.context.get("request").user if self.context.get("request") else None
        record = services.create_prompt(
            name=validated_data["name"],
            description=validated_data.get("description", ""),
            tags=tags,
            metadata=metadata,
            content=content,
            changelog=changelog,
            user=user,
        )
        return record

    def update(self, instance: PromptRecord, validated_data: Dict[str, Any]):
        content = validated_data.pop("content", None)
        metadata = validated_data.pop("metadata", None)
        changelog = validated_data.pop("changelog", "")
        tags = validated_data.pop("tags", None)
        user = self.context.get("request").user if self.context.get("request") else None
        if content is not None and metadata is None and instance.active_version:
            metadata = instance.active_version.metadata
        record = services.update_prompt(
            prompt_id=instance.id,
            name=validated_data.get("name"),
            description=validated_data.get("description"),
            tags=tags,
            is_archived=validated_data.get("is_archived"),
            content=content,
            metadata=metadata,
            changelog=changelog,
            user=user,
        )
        return record

    def to_representation(self, instance: PromptRecord):
        return {
            "id": instance.id,
            "name": instance.name,
            "description": instance.description,
            "tags": instance.tags,
            "is_archived": instance.is_archived,
            "created_at": instance.created_at,
            "updated_at": instance.updated_at,
            "created_by": instance.created_by,
            "active_version": (
                PromptVersionSerializer(instance.active_version).data
                if instance.active_version
                else None
            ),
            "latest_version": (
                PromptVersionSerializer(instance.latest_version).data
                if instance.latest_version
                else None
            ),
        }


class PromptTemplateVersionSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    template = serializers.CharField(write_only=True, required=False)
    version = serializers.IntegerField(read_only=True)
    body = serializers.CharField()
    metadata = serializers.JSONField(required=False)
    placeholders = serializers.ListField(
        child=serializers.CharField(), required=False, allow_empty=True
    )
    render_example = serializers.CharField(
        required=False, allow_blank=True, allow_null=True
    )
    changelog = serializers.CharField(required=False, allow_blank=True)
    created_at = serializers.CharField(read_only=True)
    created_by = serializers.CharField(read_only=True, allow_null=True)

    def validate_template(self, value):
        try:
            services.get_template(value)
        except KeyError as exc:
            raise serializers.ValidationError("Template not found.") from exc
        return value

    def create(self, validated_data: Dict[str, Any]):
        template_id = validated_data["template"]
        body = validated_data["body"]
        metadata = validated_data.get("metadata")
        changelog = validated_data.get("changelog", "")
        placeholders = validated_data.get("placeholders")
        render_example = validated_data.get("render_example", "")
        user = self.context.get("request").user if self.context.get("request") else None
        return services.create_prompt_template_version(
            template_id=template_id,
            content=body,
            metadata=metadata,
            changelog=changelog,
            placeholders=placeholders,
            render_example=render_example or "",
            user=user,
        )

    def to_representation(self, instance: VersionRecord):
        return {
            "id": instance.id,
            "template": instance.parent_id,
            "version": instance.version,
            "body": instance.content,
            "metadata": instance.metadata,
            "placeholders": instance.placeholders or [],
            "render_example": instance.render_example or "",
            "changelog": instance.changelog,
            "created_at": instance.created_at,
            "created_by": instance.created_by,
        }


class PromptTemplateSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    name = serializers.CharField()
    description = serializers.CharField(required=False, allow_blank=True)
    tags = TagListField(
        child=serializers.CharField(), required=False, allow_empty=True
    )
    is_archived = serializers.BooleanField(required=False)
    created_at = serializers.CharField(read_only=True)
    updated_at = serializers.CharField(read_only=True)
    created_by = serializers.CharField(read_only=True, allow_null=True)
    active_version = PromptTemplateVersionSerializer(read_only=True)
    latest_version = PromptTemplateVersionSerializer(read_only=True)
    body = serializers.CharField(write_only=True, required=False)
    metadata = serializers.JSONField(write_only=True, required=False)
    placeholders = serializers.ListField(
        child=serializers.CharField(), write_only=True, required=False, allow_empty=True
    )
    render_example = serializers.CharField(
        write_only=True, required=False, allow_blank=True
    )
    changelog = serializers.CharField(write_only=True, required=False, allow_blank=True)

    def create(self, validated_data: Dict[str, Any]):
        body = validated_data.pop("body", None)
        if not body:
            raise serializers.ValidationError({"body": "Body is required."})
        metadata = validated_data.pop("metadata", None)
        changelog = validated_data.pop("changelog", "")
        placeholders = validated_data.pop("placeholders", None)
        render_example = validated_data.pop("render_example", "")
        tags = validated_data.pop("tags", [])
        user = self.context.get("request").user if self.context.get("request") else None
        record = services.create_prompt_template(
            name=validated_data["name"],
            description=validated_data.get("description", ""),
            tags=tags,
            metadata=metadata,
            content=body,
            changelog=changelog,
            placeholders=placeholders,
            render_example=render_example or "",
            user=user,
        )
        return record

    def update(self, instance: PromptTemplateRecord, validated_data: Dict[str, Any]):
        body = validated_data.pop("body", None)
        metadata = validated_data.pop("metadata", None)
        changelog = validated_data.pop("changelog", "")
        placeholders = validated_data.pop("placeholders", None)
        render_example = validated_data.pop("render_example", None)
        tags = validated_data.pop("tags", None)
        user = self.context.get("request").user if self.context.get("request") else None
        if body is not None and metadata is None and instance.active_version:
            metadata = instance.active_version.metadata
        if body is not None and placeholders is None and instance.active_version:
            placeholders = instance.active_version.placeholders or []
        if body is not None and render_example is None and instance.active_version:
            render_example = instance.active_version.render_example or ""
        record = services.update_prompt_template(
            template_id=instance.id,
            name=validated_data.get("name"),
            description=validated_data.get("description"),
            tags=tags,
            is_archived=validated_data.get("is_archived"),
            content=body,
            metadata=metadata,
            changelog=changelog,
            placeholders=placeholders,
            render_example=render_example if render_example is not None else "",
            user=user,
        )
        return record

    def to_representation(self, instance: PromptTemplateRecord):
        return {
            "id": instance.id,
            "name": instance.name,
            "description": instance.description,
            "tags": instance.tags,
            "is_archived": instance.is_archived,
            "created_at": instance.created_at,
            "updated_at": instance.updated_at,
            "created_by": instance.created_by,
            "active_version": (
                PromptTemplateVersionSerializer(instance.active_version).data
                if instance.active_version
                else None
            ),
            "latest_version": (
                PromptTemplateVersionSerializer(instance.latest_version).data
                if instance.latest_version
                else None
            ),
        }
