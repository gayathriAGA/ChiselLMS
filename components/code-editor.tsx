"use client"

import type React from "react"

import { Badge } from "@/components/ui/badge"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/provider"
import {
  Loader2,
  Play,
  Save,
  Award,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Lightbulb,
  Cpu,
  Database,
  Maximize2,
  Minimize2,
} from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  executeCode,
  submitSolution,
  getSupportedLanguages,
  getUserSolution,
  getLanguageKeywords,
  getProblemHints,
} from "@/lib/code-execution-service"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface CodeEditorProps {
  problemId: number
  problemTitle?: string
  problemDifficulty?: string
  problemType?: string
  starterCodeTemplates: {
    [key: string]: string
  }
}

export default function CodeEditor({
  problemId,
  problemTitle = "Problem",
  problemDifficulty = "medium",
  problemType = "general",
  starterCodeTemplates,
}: CodeEditorProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { supabase, isSupabaseAvailable } = useSupabase()
  const [user, setUser] = useState<any>(null)
  const [language, setLanguage] = useState("javascript")
  const [code, setCode] = useState(starterCodeTemplates.javascript || "")
  const [isExecuting, setIsExecuting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [executionResult, setExecutionResult] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("editor")
  const [supportedLanguages, setSupportedLanguages] = useState<any[]>([])
  const [showBadgeDialog, setShowBadgeDialog] = useState(false)
  const [earnedBadges, setEarnedBadges] = useState<any[]>([])
  const [pointsEarned, setPointsEarned] = useState(0)
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const [editorHeight, setEditorHeight] = useState(500)
  const [hasCompilationError, setHasCompilationError] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [cursorPosition, setCursorPosition] = useState({ start: 0, end: 0 })
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState(0)
  const [languageKeywords, setLanguageKeywords] = useState<string[]>([])
  const [problemHints, setProblemHints] = useState<string[]>([])
  const [showHints, setShowHints] = useState(false)
  const [improvementSuggestions, setImprovementSuggestions] = useState<string[]>([])
  const [timeComplexity, setTimeComplexity] = useState<string | null>(null)
  const [spaceComplexity, setSpaceComplexity] = useState<string | null>(null)
  const [plagiarismDetected, setPlagiarismDetected] = useState(false)
  const [plagiarismScore, setPlagiarismScore] = useState(0)

  // Load user session
  useEffect(() => {
    const getUser = async () => {
      if (!supabase) return

      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user || null)

      if (session?.user) {
        // Check if user has already solved this problem
        const solution = await getUserSolution(session.user.id, problemId)
        if (solution) {
          setLanguage(solution.language)
          setCode(solution.code)
          if (solution.time_complexity) {
            setTimeComplexity(solution.time_complexity)
          }
          if (solution.space_complexity) {
            setTimeComplexity(solution.space_complexity)
          }
        }
      }
    }

    getUser()
  }, [supabase, problemId])

  // Load supported languages
  useEffect(() => {
    const loadLanguages = async () => {
      const languages = await getSupportedLanguages()
      setSupportedLanguages(languages)
    }

    loadLanguages()
  }, [])

  // Load language keywords for autocomplete
  useEffect(() => {
    const loadKeywords = async () => {
      const keywords = await getLanguageKeywords(language)
      setLanguageKeywords(keywords)
    }

    loadKeywords()
  }, [language])

  // Load problem hints
  useEffect(() => {
    const loadHints = async () => {
      const hints = await getProblemHints(problemId)
      setProblemHints(hints)
    }

    loadHints()
  }, [problemId])

  // Update code when language changes
  useEffect(() => {
    if (user) {
      // Check if user has already solved this problem in this language
      const checkSolution = async () => {
        const solution = await getUserSolution(user.id, problemId)
        if (solution && solution.language === language) {
          setCode(solution.code)
          return
        }
        setCode(starterCodeTemplates[language] || "")
      }

      checkSolution()
    } else {
      setCode(starterCodeTemplates[language] || "")
    }

    // Reset execution results when language changes
    setExecutionResult(null)
    setHasCompilationError(false)
    setTimeComplexity(null)
    setSpaceComplexity(null)
    setPlagiarismDetected(false)
    setImprovementSuggestions([])
  }, [language, starterCodeTemplates, user, problemId])

  // Adjust editor height based on window size
  useEffect(() => {
    const handleResize = () => {
      const windowHeight = window.innerHeight
      const newHeight = Math.max(400, Math.min(600, windowHeight * 0.6))
      setEditorHeight(newHeight)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Generate suggestions based on current cursor position and text
  useEffect(() => {
    if (!editorRef.current || !showSuggestions) return

    const cursorPos = editorRef.current.selectionStart
    const textBeforeCursor = code.substring(0, cursorPos)
    const lastWord = textBeforeCursor.match(/[\w\d_]+$/) || [""]

    if (lastWord[0].length < 2) {
      setSuggestions([])
      return
    }

    // Filter keywords based on the current word
    const matchingSuggestions = languageKeywords
      .filter((keyword) => keyword.toLowerCase().startsWith(lastWord[0].toLowerCase()))
      .slice(0, 5) // Limit to 5 suggestions

    setSuggestions(matchingSuggestions)
    setSelectedSuggestion(0)
  }, [cursorPosition, showSuggestions, languageKeywords, code])

  // Handle language change
  const handleLanguageChange = (value: string) => {
    setLanguage(value)
    setExecutionResult(null)
    setHasCompilationError(false)
  }

  // Handle code execution
  const handleRunCode = async () => {
    if (!code.trim()) {
      toast({
        title: "Error",
        description: "Please write some code before running.",
        variant: "destructive",
      })
      return
    }

    setIsExecuting(true)
    setExecutionResult(null)
    setHasCompilationError(false)
    setTimeComplexity(null)
    setSpaceComplexity(null)
    setPlagiarismDetected(false)
    setImprovementSuggestions([])

    try {
      const result = await executeCode(code, language, problemId)
      setExecutionResult(result)
      setActiveTab("output") // Switch to output tab after execution

      // Check for compilation errors
      if (result.compilationError) {
        setHasCompilationError(true)
        toast({
          title: "Compilation Error",
          description: "Your code failed to compile. Check the output for details.",
          variant: "destructive",
        })
      }

      // Set complexity analysis results
      if (result.timeComplexity) {
        setTimeComplexity(result.timeComplexity)
      }
      if (result.spaceComplexity) {
        setSpaceComplexity(result.spaceComplexity)
      }

      // Check for plagiarism
      if (result.potentialPlagiarism) {
        setPlagiarismDetected(true)
        setPlagiarismScore(result.plagiarismScore || 0)
      }
    } catch (error) {
      toast({
        title: "Execution Error",
        description: "Failed to execute code. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExecuting(false)
    }
  }

  // Handle code submission
  const handleSubmitCode = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit your solution.",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    if (!code.trim()) {
      toast({
        title: "Error",
        description: "Please write some code before submitting.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    setHasCompilationError(false)

    try {
      const result = await submitSolution(user.id, problemId, code, language)

      if (!result.success) {
        throw new Error(result.message || "Failed to submit solution")
      }

      setExecutionResult(result.executionResult)
      setActiveTab("output") // Switch to output tab after submission

      // Set improvement suggestions if available
      if (result.improvementSuggestions) {
        setImprovementSuggestions(result.improvementSuggestions)
      }

      // Check for compilation errors
      if (result.executionResult?.compilationError) {
        setHasCompilationError(true)
        toast({
          title: "Compilation Error",
          description: "Your code failed to compile. Check the output for details.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Check for plagiarism
      if (result.executionResult?.potentialPlagiarism) {
        setPlagiarismDetected(true)
        setPlagiarismScore(result.executionResult.plagiarismScore || 0)

        if ((result.executionResult.plagiarismScore || 0) > 0.8) {
          toast({
            title: "Potential Plagiarism Detected",
            description: `Your solution has a high similarity (${Math.round((result.executionResult.plagiarismScore || 0) * 100)}%) with existing solutions. Please ensure your work is original.`,
            variant: "destructive",
          })
          setIsSubmitting(false)
          return
        }
      }

      // Check if badges were earned
      if (result.badgesEarned && result.badgesEarned.length > 0) {
        setEarnedBadges(result.badgesEarned)
        setPointsEarned(result.pointsEarned || 0)
        setShowBadgeDialog(true)
      } else {
        const allPassed = result.executionResult.testCasesPassed === result.executionResult.totalTestCases

        toast({
          title: allPassed ? "All Tests Passed!" : "Some Tests Failed",
          description: `Your solution has been submitted. ${result.executionResult.testCasesPassed} of ${result.executionResult.totalTestCases} test cases passed. ${allPassed ? `You earned ${result.pointsEarned} points!` : ""}`,
          variant: allPassed ? "default" : "destructive",
        })
      }

      // Refresh the page to show updated submission status
      router.refresh()
    } catch (error) {
      toast({
        title: "Submission Error",
        description: error instanceof Error ? error.message : "Failed to submit your solution. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle tab key in editor
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle suggestions navigation
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedSuggestion((prev) => (prev + 1) % suggestions.length)
        return
      }

      if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedSuggestion((prev) => (prev - 1 + suggestions.length) % suggestions.length)
        return
      }

      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault()
        insertSuggestion(suggestions[selectedSuggestion])
        return
      }

      if (e.key === "Escape") {
        e.preventDefault()
        setShowSuggestions(false)
        return
      }
    }

    // Handle tab key for indentation
    if (e.key === "Tab") {
      e.preventDefault()
      const start = e.currentTarget.selectionStart
      const end = e.currentTarget.selectionEnd

      // Insert 2 spaces for indentation
      const newValue = code.substring(0, start) + "  " + code.substring(end)
      setCode(newValue)

      // Move cursor position after the inserted tab
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.selectionStart = editorRef.current.selectionEnd = start + 2
          setCursorPosition({ start: start + 2, end: start + 2 })
        }
      }, 0)
    }

    // Show suggestions on Ctrl+Space
    if (e.key === " " && e.ctrlKey) {
      e.preventDefault()
      setShowSuggestions(true)
    }
  }

  // Handle cursor position change
  const handleCursorPositionChange = () => {
    if (editorRef.current) {
      const start = editorRef.current.selectionStart
      const end = editorRef.current.selectionEnd
      setCursorPosition({ start, end })

      // Show suggestions if typing a word
      const textBeforeCursor = code.substring(0, start)
      const lastWord = textBeforeCursor.match(/[\w\d_]+$/) || [""]

      if (lastWord[0].length >= 2) {
        setShowSuggestions(true)
      } else {
        setShowSuggestions(false)
      }
    }
  }

  // Insert suggestion at cursor position
  const insertSuggestion = (suggestion: string) => {
    if (!editorRef.current) return

    const start = editorRef.current.selectionStart
    const textBeforeCursor = code.substring(0, start)
    const lastWordMatch = textBeforeCursor.match(/[\w\d_]+$/) || [""]
    const lastWord = lastWordMatch[0]
    const lastWordStart = start - lastWord.length

    const newCode = code.substring(0, lastWordStart) + suggestion + code.substring(start)
    setCode(newCode)

    // Move cursor after the inserted suggestion
    setTimeout(() => {
      if (editorRef.current) {
        const newPosition = lastWordStart + suggestion.length
        editorRef.current.selectionStart = editorRef.current.selectionEnd = newPosition
        setCursorPosition({ start: newPosition, end: newPosition })
      }
    }, 0)

    setShowSuggestions(false)
  }

  // Toggle fullscreen mode
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen)
  }

  return (
    <div className={`flex flex-col ${isFullScreen ? "fixed inset-0 z-50 bg-background p-4" : "h-full"}`}>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Language" />
            </SelectTrigger>
            <SelectContent>
              {supportedLanguages.length > 0 ? (
                supportedLanguages.map((lang) => (
                  <SelectItem key={lang.name} value={lang.name}>
                    {lang.display_name} ({lang.version})
                  </SelectItem>
                ))
              ) : (
                <>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                  <SelectItem value="cpp">C++</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>

          {timeComplexity && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="ml-2">
                    <Cpu className="h-3 w-3 mr-1" />
                    {timeComplexity}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Time Complexity</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {spaceComplexity && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="ml-2">
                    <Database className="h-3 w-3 mr-1" />
                    {spaceComplexity}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Space Complexity</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowHints(!showHints)}
                  className={showHints ? "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200" : ""}
                >
                  <Lightbulb className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Show Hints</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={toggleFullScreen}>
                  {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isFullScreen ? "Exit Fullscreen" : "Fullscreen"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            variant="outline"
            onClick={handleRunCode}
            disabled={isExecuting || isSubmitting}
            className={hasCompilationError ? "border-red-500 hover:border-red-600" : ""}
          >
            {isExecuting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run Code
              </>
            )}
          </Button>

          <Button
            onClick={handleSubmitCode}
            disabled={isExecuting || isSubmitting || !isSupabaseAvailable || !user || hasCompilationError}
            className={hasCompilationError ? "bg-gray-500 hover:bg-gray-600" : ""}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Submit
              </>
            )}
          </Button>
        </div>
      </div>

      {!isSupabaseAvailable && (
        <Alert className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Supabase not configured</AlertTitle>
          <AlertDescription>
            Code execution is available, but submissions require Supabase to be configured.
          </AlertDescription>
        </Alert>
      )}

      {!user && isSupabaseAvailable && (
        <Alert className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Authentication required</AlertTitle>
          <AlertDescription>
            Please{" "}
            <Button variant="link" className="p-0" onClick={() => router.push("/login")}>
              log in
            </Button>{" "}
            to submit your solutions and track your progress.
          </AlertDescription>
        </Alert>
      )}

      {hasCompilationError && (
        <Alert className="mb-4" variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Compilation Error</AlertTitle>
          <AlertDescription>Your code has compilation errors. Please fix them before submitting.</AlertDescription>
        </Alert>
      )}

      {plagiarismDetected && (
        <Alert className="mb-4" variant={plagiarismScore > 0.8 ? "destructive" : "warning"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Potential Plagiarism Detected</AlertTitle>
          <AlertDescription>
            Your solution has a {Math.round(plagiarismScore * 100)}% similarity with existing solutions.
            {plagiarismScore > 0.8
              ? " Please ensure your work is original."
              : " Consider adding comments to explain your approach."}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col h-full border rounded-md">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
          <TabsList className="mx-4 mt-2 justify-start">
            <TabsTrigger value="editor">Code Editor</TabsTrigger>
            <TabsTrigger value="output">Output</TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="flex-1 p-0 m-0 relative">
            <div className="relative h-full">
              <textarea
                ref={editorRef}
                className="w-full font-mono text-sm bg-muted resize-none focus:outline-none p-4"
                style={{ height: `${editorHeight}px` }}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value)
                  handleCursorPositionChange()
                }}
                onKeyDown={handleKeyDown}
                onClick={handleCursorPositionChange}
                onKeyUp={handleCursorPositionChange}
                placeholder="Write your code here..."
                spellCheck="false"
              />

              {/* Suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  className="absolute bg-popover border rounded-md shadow-md z-10 max-h-60 overflow-y-auto"
                  style={{
                    left: `${editorRef.current?.getBoundingClientRect().left || 0}px`,
                    top: `${(editorRef.current?.getBoundingClientRect().top || 0) + 20 + (cursorPosition.start / code.length) * editorHeight}px`,
                  }}
                >
                  <ul className="py-1">
                    {suggestions.map((suggestion, index) => (
                      <li
                        key={suggestion}
                        className={`px-3 py-1 cursor-pointer hover:bg-accent ${index === selectedSuggestion ? "bg-accent" : ""}`}
                        onClick={() => insertSuggestion(suggestion)}
                      >
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Hints panel */}
              {showHints && problemHints.length > 0 && (
                <div className="absolute top-2 right-2 w-64 bg-amber-50 border border-amber-200 rounded-md shadow-md p-3 z-10">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-amber-900 flex items-center">
                      <Lightbulb className="h-4 w-4 mr-1 text-amber-500" />
                      Hints
                    </h3>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowHints(false)}>
                      <XCircle className="h-4 w-4 text-amber-700" />
                    </Button>
                  </div>
                  <ul className="space-y-2">
                    {problemHints.map((hint, index) => (
                      <li key={index} className="text-xs text-amber-800">
                        • {hint}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-amber-600 mt-2 italic">Press Ctrl+Space for code suggestions</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="output" className="flex-1 p-0 m-0">
            {executionResult ? (
              <div className="p-4" style={{ height: `${editorHeight}px`, overflowY: "auto" }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Execution Results</span>
                      {executionResult.compilationError ? (
                        <Badge variant="destructive">Compilation Error</Badge>
                      ) : executionResult.testCasesPassed === executionResult.totalTestCases ? (
                        <Badge className="bg-green-500">All Tests Passed</Badge>
                      ) : (
                        <Badge variant="destructive">
                          {executionResult.testCasesPassed} of {executionResult.totalTestCases} Tests Passed
                        </Badge>
                      )}
                    </CardTitle>
                    {executionResult.timeComplexity && (
                      <CardDescription>
                        Time Complexity: {executionResult.timeComplexity} | Space Complexity:{" "}
                        {executionResult.spaceComplexity || "Unknown"}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    {executionResult.compilationError ? (
                      <div className="bg-red-950/20 p-4 rounded-md overflow-x-auto whitespace-pre-wrap text-red-400 font-mono text-sm">
                        {executionResult.output}
                      </div>
                    ) : (
                      <pre className="bg-muted p-4 rounded-md overflow-x-auto whitespace-pre-wrap font-mono text-sm">
                        {executionResult.output}
                      </pre>
                    )}

                    {/* Improvement suggestions */}
                    {improvementSuggestions && improvementSuggestions.length > 0 && (
                      <div className="mt-4 bg-blue-950/10 p-4 rounded-md">
                        <h3 className="text-sm font-medium mb-2 flex items-center text-blue-500">
                          <Lightbulb className="h-4 w-4 mr-1" />
                          Improvement Suggestions
                        </h3>
                        <ul className="space-y-1">
                          {improvementSuggestions.map((suggestion, index) => (
                            <li key={index} className="text-xs text-blue-400">
                              • {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex flex-col items-start gap-2">
                    {!executionResult.compilationError && (
                      <>
                        <div className="grid grid-cols-2 gap-4 w-full">
                          <div>
                            <p className="text-sm font-medium flex items-center">
                              <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                              Execution Time
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {executionResult.executionTime.toFixed(2)} s
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Memory Used</p>
                            <p className="text-sm text-muted-foreground">{executionResult.memoryUsed.toFixed(2)} MB</p>
                          </div>
                        </div>
                        <div className="w-full">
                          <p className="text-sm font-medium">Test Cases</p>
                          <p className="text-sm text-muted-foreground">
                            {executionResult.testCasesPassed} of {executionResult.totalTestCases} test cases passed
                          </p>
                          <div className="w-full bg-muted rounded-full h-2.5 mt-2">
                            <div
                              className={`h-2.5 rounded-full ${
                                executionResult.testCasesPassed === executionResult.totalTestCases
                                  ? "bg-green-500"
                                  : executionResult.testCasesPassed > 0
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                              }`}
                              style={{
                                width: `${(executionResult.testCasesPassed / executionResult.totalTestCases) * 100}%`,
                              }}
                            ></div>
                          </div>
                        </div>

                        {executionResult.testCaseResults && executionResult.testCaseResults.length > 0 && (
                          <div className="w-full mt-4">
                            <p className="text-sm font-medium mb-2">Test Case Details</p>
                            <div className="space-y-4">
                              {executionResult.testCaseResults.map((result: any, index: number) => (
                                <Card
                                  key={index}
                                  className={result.passed ? "border-green-500/50" : "border-red-500/50"}
                                >
                                  <CardHeader className="py-3">
                                    <div className="flex justify-between items-center">
                                      <h3 className="font-medium text-base">Test Case {index + 1}</h3>
                                      <Badge className={result.passed ? "bg-green-500" : "bg-red-500"}>
                                        {result.passed ? "Passed" : "Failed"}
                                      </Badge>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="py-2">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <p className="font-medium mb-1">Input:</p>
                                        <pre className="bg-muted p-2 rounded-md overflow-x-auto text-xs font-mono">
                                          {result.input}
                                        </pre>
                                      </div>
                                      <div>
                                        <p className="font-medium mb-1">Expected Output:</p>
                                        <pre className="bg-muted p-2 rounded-md overflow-x-auto text-xs font-mono">
                                          {result.expectedOutput}
                                        </pre>
                                      </div>

                                      {!result.passed && (
                                        <div className="md:col-span-2">
                                          <p className="font-medium mb-1">Your Output:</p>
                                          <pre className="bg-red-950/20 p-2 rounded-md overflow-x-auto text-xs font-mono text-red-400">
                                            {result.actualOutput || "No output"}
                                          </pre>
                                        </div>
                                      )}

                                      {result.errorMessage && (
                                        <div className="md:col-span-2">
                                          <p className="font-medium mb-1">Error:</p>
                                          <pre className="bg-red-950/20 p-2 rounded-md overflow-x-auto text-xs font-mono text-red-400">
                                            {result.errorMessage}
                                          </pre>
                                        </div>
                                      )}

                                      {result.diff && !result.passed && (
                                        <div className="md:col-span-2">
                                          <p className="font-medium mb-1">Difference:</p>
                                          <pre className="bg-yellow-950/20 p-2 rounded-md overflow-x-auto text-xs font-mono text-yellow-400">
                                            {result.diff}
                                          </pre>
                                        </div>
                                      )}

                                      {result.executionTime && (
                                        <div className="md:col-span-2">
                                          <p className="font-medium mb-1">Execution Time:</p>
                                          <p className="text-xs">{result.executionTime.toFixed(2)} ms</p>
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardFooter>
                </Card>
              </div>
            ) : (
              <div
                className="flex items-center justify-center text-muted-foreground"
                style={{ height: `${editorHeight}px` }}
              >
                Run your code to see the output here
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Badge earned dialog */}
      <Dialog open={showBadgeDialog} onOpenChange={setShowBadgeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Achievement Unlocked!</DialogTitle>
            <DialogDescription className="text-center">
              Congratulations! You've earned {pointsEarned} points and unlocked {earnedBadges.length} new badge
              {earnedBadges.length > 1 ? "s" : ""}!
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-4">
            {earnedBadges.map((badge, index) => (
              <div key={index} className="flex items-center space-x-4 w-full">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Award className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{badge.name}</h4>
                  <p className="text-sm text-muted-foreground">{badge.description}</p>
                </div>
                <Badge variant="outline">+{badge.points} pts</Badge>
              </div>
            ))}
          </div>
          <div className="flex justify-center">
            <Button onClick={() => setShowBadgeDialog(false)}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
