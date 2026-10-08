Option Explicit

Dim shell, files, repo, server, node, folder, candidate, url, request, ready, i
Set shell = CreateObject("WScript.Shell")
Set files = CreateObject("Scripting.FileSystemObject")
repo = files.GetParentFolderName(files.GetParentFolderName(files.GetParentFolderName(WScript.ScriptFullName)))
server = files.BuildPath(repo, "tools\editor\server.cjs")
url = "http://127.0.0.1:4010/"

Function IsReady()
    On Error Resume Next
    Dim probe
    Set probe = CreateObject("MSXML2.ServerXMLHTTP.6.0")
    probe.setTimeouts 300, 300, 300, 1000
    probe.open "GET", url & "api/init", False
    probe.send
    IsReady = (Err.Number = 0 And probe.status = 200)
    Err.Clear
    On Error GoTo 0
End Function

If Not IsReady() Then
    node = ""
    For Each folder In Split(shell.ExpandEnvironmentStrings("%PATH%"), ";")
        candidate = files.BuildPath(folder, "node.exe")
        If files.FileExists(candidate) Then
            node = candidate
            Exit For
        End If
    Next
    If node = "" Then
        candidate = shell.ExpandEnvironmentStrings("%ProgramFiles%") & "\nodejs\node.exe"
        If files.FileExists(candidate) Then node = candidate
    End If
    If node = "" Then
        MsgBox "Node.js was not found. Install Node.js, then open the blog editor again.", 16, "Junshi Blog Editor"
        WScript.Quit 1
    End If
    shell.Environment("PROCESS")("BLOG_EDITOR_PORT") = "4010"
    shell.Environment("PROCESS")("BLOG_PREVIEW_PORT") = "4011"
    shell.Run """" & node & """ """ & server & """", 0, False
    ready = False
    For i = 1 To 50
        WScript.Sleep 200
        If IsReady() Then
            ready = True
            Exit For
        End If
    Next
    If Not ready Then
        MsgBox "The blog editor did not start. Run npm run editor in the blog folder to see the error.", 16, "Junshi Blog Editor"
        WScript.Quit 1
    End If
End If

shell.Run url, 1, False
