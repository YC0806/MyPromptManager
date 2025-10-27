from __future__ import annotations

from typing import List, Tuple

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response

from prompts import services
from prompts.models import VersionRecord

from .serializers import (
    PromptSerializer,
    PromptTemplateSerializer,
    PromptTemplateVersionSerializer,
    PromptVersionSerializer,
    TagSerializer,
)


def _parse_version_pk(pk: str) -> Tuple[str, int]:
    if ":v" not in pk:
        raise NotFound("Version identifier is invalid.")
    parent_id, version_str = pk.split(":v", 1)
    try:
        version = int(version_str)
    except ValueError as exc:
        raise NotFound("Version identifier is invalid.") from exc
    return parent_id, version


class TagViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def list(self, request):
        tags = services.list_tags()
        serializer = TagSerializer(tags, many=True)
        return Response(serializer.data)

    def create(self, request):
        serializer = TagSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tag = serializer.save()
        output = TagSerializer(tag)
        return Response(output.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, pk=None):
        services.delete_tag(pk)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PromptViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def list(self, request):
        search = request.query_params.get("search")
        tag_params = request.query_params.getlist("tags__name") or []
        tags = []
        for value in tag_params:
            tags.extend([segment.strip() for segment in value.split(",") if segment])
        is_archived_param = request.query_params.get("is_archived")
        include_archived = None
        if is_archived_param is not None:
            include_archived = is_archived_param.lower() == "true"
        records = services.list_prompts(
            search=search, tags=tags, include_archived=include_archived
        )
        serializer = PromptSerializer(
            records, many=True, context={"request": request}
        )
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        try:
            record = services.get_prompt(pk)
        except KeyError as exc:
            raise NotFound("Prompt not found.") from exc
        serializer = PromptSerializer(record, context={"request": request})
        return Response(serializer.data)

    def create(self, request):
        serializer = PromptSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        record = serializer.save()
        output = PromptSerializer(record, context={"request": request})
        return Response(output.data, status=status.HTTP_201_CREATED)

    def update(self, request, pk=None):
        return self._update(request, pk, partial=False)

    def partial_update(self, request, pk=None):
        return self._update(request, pk, partial=True)

    def _update(self, request, pk: str, partial: bool):
        try:
            instance = services.get_prompt(pk)
        except KeyError as exc:
            raise NotFound("Prompt not found.") from exc
        serializer = PromptSerializer(
            instance, data=request.data, context={"request": request}, partial=partial
        )
        serializer.is_valid(raise_exception=True)
        record = serializer.save()
        output = PromptSerializer(record, context={"request": request})
        return Response(output.data)

    def destroy(self, request, pk=None):
        services.delete_prompt(pk)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PromptVersionViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def list(self, request):
        prompt_id = request.query_params.get("prompt")
        versions: List[VersionRecord] = []
        if prompt_id:
            try:
                versions = services.list_prompt_versions(prompt_id)
            except KeyError as exc:
                raise NotFound("Prompt not found.") from exc
        else:
            all_prompts = services.list_prompts(include_archived=True)
            for prompt in all_prompts:
                versions.extend(services.list_prompt_versions(prompt.id))
        serializer = PromptVersionSerializer(
            versions, many=True, context={"request": request}
        )
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        prompt_id, version_number = _parse_version_pk(pk)
        try:
            version = services.get_prompt_version(prompt_id, version_number)
        except KeyError as exc:
            raise NotFound("Version not found.") from exc
        serializer = PromptVersionSerializer(version, context={"request": request})
        return Response(serializer.data)

    def create(self, request):
        serializer = PromptVersionSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        version = serializer.save()
        output = PromptVersionSerializer(version, context={"request": request})
        return Response(output.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        prompt_id, version_number = _parse_version_pk(pk)
        changelog = request.data.get("changelog")
        try:
            new_version = services.restore_prompt_version(
                prompt_id=prompt_id,
                version=version_number,
                user=request.user if request.user.is_authenticated else None,
                changelog=changelog,
            )
        except KeyError as exc:
            raise NotFound("Version not found.") from exc
        serializer = PromptVersionSerializer(new_version, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PromptTemplateViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def list(self, request):
        search = request.query_params.get("search")
        tag_params = request.query_params.getlist("tags__name") or []
        tags = []
        for value in tag_params:
            tags.extend([segment.strip() for segment in value.split(",") if segment])
        is_archived_param = request.query_params.get("is_archived")
        include_archived = None
        if is_archived_param is not None:
            include_archived = is_archived_param.lower() == "true"
        records = services.list_templates(
            search=search, tags=tags, include_archived=include_archived
        )
        serializer = PromptTemplateSerializer(
            records, many=True, context={"request": request}
        )
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        try:
            record = services.get_template(pk)
        except KeyError as exc:
            raise NotFound("Template not found.") from exc
        serializer = PromptTemplateSerializer(record, context={"request": request})
        return Response(serializer.data)

    def create(self, request):
        serializer = PromptTemplateSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        record = serializer.save()
        output = PromptTemplateSerializer(record, context={"request": request})
        return Response(output.data, status=status.HTTP_201_CREATED)

    def update(self, request, pk=None):
        return self._update(request, pk, partial=False)

    def partial_update(self, request, pk=None):
        return self._update(request, pk, partial=True)

    def _update(self, request, pk: str, partial: bool):
        try:
            instance = services.get_template(pk)
        except KeyError as exc:
            raise NotFound("Template not found.") from exc
        serializer = PromptTemplateSerializer(
            instance, data=request.data, context={"request": request}, partial=partial
        )
        serializer.is_valid(raise_exception=True)
        record = serializer.save()
        output = PromptTemplateSerializer(record, context={"request": request})
        return Response(output.data)

    def destroy(self, request, pk=None):
        services.delete_prompt_template(pk)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PromptTemplateVersionViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def list(self, request):
        template_id = request.query_params.get("template")
        versions: List[VersionRecord] = []
        if template_id:
            try:
                versions = services.list_template_versions(template_id)
            except KeyError as exc:
                raise NotFound("Template not found.") from exc
        else:
            all_templates = services.list_templates(include_archived=True)
            for template in all_templates:
                versions.extend(services.list_template_versions(template.id))
        serializer = PromptTemplateVersionSerializer(
            versions, many=True, context={"request": request}
        )
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        template_id, version_number = _parse_version_pk(pk)
        try:
            version = services.get_template_version(template_id, version_number)
        except KeyError as exc:
            raise NotFound("Version not found.") from exc
        serializer = PromptTemplateVersionSerializer(
            version, context={"request": request}
        )
        return Response(serializer.data)

    def create(self, request):
        serializer = PromptTemplateVersionSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        version = serializer.save()
        output = PromptTemplateVersionSerializer(version, context={"request": request})
        return Response(output.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        template_id, version_number = _parse_version_pk(pk)
        changelog = request.data.get("changelog")
        try:
            new_version = services.restore_prompt_template_version(
                template_id=template_id,
                version=version_number,
                user=request.user if request.user.is_authenticated else None,
                changelog=changelog,
            )
        except KeyError as exc:
            raise NotFound("Version not found.") from exc
        serializer = PromptTemplateVersionSerializer(
            new_version, context={"request": request}
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)
