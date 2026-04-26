# Mnemosyne.WPF 技术手册

## 1. 项目简介与架构概述

**Mnemosyne.WPF** 是一个基于 **.NET 10** 构建的 Windows 桌面客户端应用程序。该项目采用混合架构设计，将本地 C# WPF 后端与 JavaScript 前端相融合，以提供现代化的桌面应用程序体验。

### 技术栈
- **后端**：WPF (Windows Presentation Foundation) / C# / .NET 10
- **前端**：JavaScript / HTML / CSS / JSON
- **IDE**：Microsoft Visual Studio 2026 (或支持 .NET 10 的 IDE)

## 2. 编码与命名规范

本项目在开发中严格遵循以下命名与注释规范，以确保与前端/后端通信顺畅和代码库的统一性：

### 命名约定
- **后端 (C# Models)**：所有 C# 模型类、属性必须使用 **大驼峰命名法（`PascalCase`）**。
- **前端 (JavaScript & JSON)**：所有的 JS 变量、函数、以及任何前后端传递的 JSON 数据结构，必须使用 **小驼峰命名法（`camelCase`）**。

### 注释文档
- **前端 JavaScript**：所有前端的 JavaScript 文件（例如 `frontend/js/echoes.js`）中的函数、参数和重要变量，必须使用 **JSDoc** 风格添加清晰、完整的类型注解和说明。

## 3. 核心业务逻辑说明

### 游戏消费分析 (Game Consumption Analysis)
该项目的一项核心业务功能是针对游戏内特定消费行为进行分析记录。在设计这些模型与算法时，需基于以下业务场景与预设条件：
- **交易特性**：聚焦于**低频次、高金额**的消费场景。
- **数据指标**：
  - 每月交易频次通常不超过 **10 笔**。
  - 单次交易金额通常为 **2 位数到 4 位数**（例如 10 到 9999 范围内）。
- *开发提示：前端图表渲染或后端清洗数据时，请以此范围作为处理离群值和缩放图表轴的基准。*

## 4. 后端与前端交互机制

- 应用程序通过宿主的 Web/JS 容器实现 C# 与 JavaScript 之间的双向通信。
- 在序列化数据进行传递时，确保 C#的 `PascalCase` 能够被正确序列化并在 JS 中以 `camelCase` 接收，并在通信的两端做好空值处理和异常捕获。

## 5. 开发与构建指南

1. **环境准备**：确认已安装针对 `.NET 10` 的 SDK 及 Visual Studio。
2. **克隆项目**：
   ```bash
   git clone https://github.com/AE-26710/Mnemosyne.WPF.git
   ```
3. **打开解决方案**：双击 `Mnemosyne.WPF.sln` 在 Visual Studio 中打开。
4. **编译与运行**：根据 IDE 提示还原 NuGet 包，或者通过 PowerShell 根目录下运行：
   ```pwsh
   dotnet build
   dotnet run --project Mnemosyne.WPF
   ```
5. **前端调试**：前端相关的 JS 脚本主要位于 `frontend/js/` 目录下（如 `echoes.js`），在进行更新后，需要确保文件被更新到输出目录以使更改在 WPF 内核中生效。